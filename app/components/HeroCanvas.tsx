"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "../lib/gsap";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2  uMediaRes;
  uniform vec2  uViewRes;
  uniform vec2  uMouse;
  uniform float uProgress;
  uniform float uTime;
  uniform float uHasTexture;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),                hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // Scales uv so the media covers the viewport without distortion.
  vec2 coverUv(vec2 uv, vec2 media, vec2 view) {
    vec2 r = vec2(
      min((view.x / view.y) / (media.x / media.y), 1.0),
      min((view.y / view.x) / (media.y / media.x), 1.0)
    );
    return uv * r + (1.0 - r) * 0.5;
  }

  void main() {
    // Settle from a slight push-in as the reveal completes.
    float zoom = mix(1.16, 1.0, uProgress);
    vec2 uv = (vUv - 0.5) * zoom + 0.5;
    uv += uMouse * 0.014;
    uv = coverUv(uv, uMediaRes, uViewRes);

    vec3 color = texture2D(uTexture, uv).rgb * uHasTexture;

    // Noise-dissolve curtain climbing from the bottom of the frame.
    float grain2d = noise(vUv * 4.0) * 0.18;
    float field = vUv.y * 0.75 + grain2d;
    float threshold = mix(-0.35, 1.35, uProgress);
    float mask = 1.0 - smoothstep(threshold - 0.22, threshold + 0.02, field);

    // Light that rides the dissolve edge, gone once the reveal lands.
    float edge = 1.0 - smoothstep(0.0, 0.07, abs(field - threshold));
    color += edge * 0.14 * (1.0 - smoothstep(0.92, 1.0, uProgress));

    color *= mask;

    // Grade: hold the highlights back so display type stays readable.
    color = pow(color, vec3(1.06));
    color *= 0.84;

    float vig = distance(vUv, vec2(0.5));
    color *= 1.0 - smoothstep(0.32, 0.98, vig) * 0.6;

    float g = hash(vUv * uViewRes + fract(uTime));
    color += (g - 0.5) * 0.042;

    gl_FragColor = vec4(color, 1.0);
  }
`;

type Props = {
  /** The shared hero <video>; textured once it has real dimensions. */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Flips true when the preloader hands over — starts the reveal. */
  revealed: boolean;
  /** Called when WebGL is unavailable so the DOM video can take over. */
  onUnsupported: () => void;
};

export default function HeroCanvas({
  videoRef,
  revealed,
  onUnsupported,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const uniformsRef = useRef<Record<string, THREE.IUniform> | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const video = videoRef.current;
    if (!mount || !video) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      onUnsupported();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const uniforms: Record<string, THREE.IUniform> = {
      uTexture: { value: texture },
      uMediaRes: { value: new THREE.Vector2(16, 9) },
      uViewRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uHasTexture: { value: 0 },
    };
    uniformsRef.current = uniforms;

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const syncSize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      uniforms.uViewRes.value.set(w, h);
    };
    syncSize();

    const syncMedia = () => {
      if (video.videoWidth && video.videoHeight) {
        uniforms.uMediaRes.value.set(video.videoWidth, video.videoHeight);
        uniforms.uHasTexture.value = 1;
      }
    };
    syncMedia();
    video.addEventListener("loadedmetadata", syncMedia);

    const observer = new ResizeObserver(syncSize);
    observer.observe(mount);

    // Pointer parallax, normalised to [-1, 1] and eased toward the target.
    const target = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const startedAt = performance.now();
    let frame = 0;
    const render = () => {
      frame = requestAnimationFrame(render);
      uniforms.uTime.value = (performance.now() - startedAt) / 1000;
      const m = uniforms.uMouse.value as THREE.Vector2;
      m.x += (target.x - m.x) * 0.045;
      m.y += (target.y - m.y) * 0.045;
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      video.removeEventListener("loadedmetadata", syncMedia);
      uniformsRef.current = null;
      texture.dispose();
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onUnsupported, videoRef]);

  useEffect(() => {
    const uniforms = uniformsRef.current;
    if (!uniforms || !revealed) return;

    const tween = gsap.to(uniforms.uProgress, {
      value: 1,
      duration: 2.1,
      ease: "power2.inOut",
    });
    return () => {
      tween.kill();
    };
  }, [revealed]);

  return <div className="hero-canvas" ref={mountRef} aria-hidden="true" />;
}
