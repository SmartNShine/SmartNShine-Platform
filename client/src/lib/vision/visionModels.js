import { FilesetResolver, FaceLandmarker, ObjectDetector } from "@mediapipe/tasks-vision";

// Block Google MediaPipe internal telemetry calls from spamming 403 errors and retries
if (typeof window !== "undefined" && !window.__odml_telemetry_blocked) {
  window.__odml_telemetry_blocked = true;
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    if (url.includes("odml.pa.googleapis.com")) {
      return new Response("{}", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return originalFetch.apply(window, args);
  };
}

// Silence internal Emscripten / WebGL C++ informational logs from flooding React DevTools
if (typeof window !== "undefined" && !window.__mediapipe_warn_filter_installed) {
  window.__mediapipe_warn_filter_installed = true;
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (
      msg.includes("face_landmarker_graph.cc") ||
      msg.includes("gl_context.cc") ||
      msg.includes("xnnpack") ||
      msg.includes("OpenGL error checking is disabled")
    ) {
      return; // Filter internal MediaPipe Wasm startup notices
    }
    originalWarn.apply(console, args);
  };
}

const WASM_CDN_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const FACE_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const OBJECT_DETECTOR_MODEL =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";

let visionResolverInstance = null;
let faceLandmarkerInstance = null;
let objectDetectorInstance = null;
let initPromise = null;

/**
 * Obtain or initialize the FilesetResolver for MediaPipe Vision tasks
 */
export async function getVisionResolver() {
  if (!visionResolverInstance) {
    visionResolverInstance = await FilesetResolver.forVisionTasks(WASM_CDN_PATH);
  }
  return visionResolverInstance;
}

/**
 * Initialize FaceLandmarker with GPU delegate and CPU fallback
 */
export async function getFaceLandmarker() {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;

  const resolver = await getVisionResolver();

  try {
    // Attempt GPU acceleration first
    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(resolver, {
      baseOptions: {
        modelAssetPath: FACE_LANDMARKER_MODEL,
        delegate: "GPU",
      },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: "VIDEO",
      numFaces: 4, // Enables detecting multiple people in frame
      minFaceDetectionConfidence: 0.7,
      minFacePresenceConfidence: 0.7,
    });
    console.log("⚡ FaceLandmarker initialized with GPU delegate");
  } catch (gpuError) {
    console.warn("⚠️ GPU delegate failed for FaceLandmarker, falling back to CPU:", gpuError.message);
    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(resolver, {
      baseOptions: {
        modelAssetPath: FACE_LANDMARKER_MODEL,
        delegate: "CPU",
      },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: "VIDEO",
      numFaces: 4,
      minFaceDetectionConfidence: 0.7,
      minFacePresenceConfidence: 0.7,
    });
    console.log("ℹ️ FaceLandmarker initialized with CPU delegate");
  }

  return faceLandmarkerInstance;
}

/**
 * Initialize ObjectDetector with GPU delegate and CPU fallback
 * Detects prohibited objects such as cell phones, books, and laptops
 */
export async function getObjectDetector() {
  if (objectDetectorInstance) return objectDetectorInstance;

  const resolver = await getVisionResolver();

  try {
    objectDetectorInstance = await ObjectDetector.createFromOptions(resolver, {
      baseOptions: {
        modelAssetPath: OBJECT_DETECTOR_MODEL,
        delegate: "GPU",
      },
      scoreThreshold: 0.32, // Calibrated threshold for cell phones (prevents false positives from laptops/desks)
      runningMode: "VIDEO",
    });
    console.log("⚡ ObjectDetector initialized with GPU delegate");
  } catch (gpuError) {
    console.warn("⚠️ GPU delegate failed for ObjectDetector, falling back to CPU:", gpuError.message);
    objectDetectorInstance = await ObjectDetector.createFromOptions(resolver, {
      baseOptions: {
        modelAssetPath: OBJECT_DETECTOR_MODEL,
        delegate: "CPU",
      },
      scoreThreshold: 0.32,
      runningMode: "VIDEO",
    });
    console.log("ℹ️ ObjectDetector initialized with CPU delegate");
  }

  return objectDetectorInstance;
}

/**
 * Pre-warm and initialize both vision models simultaneously
 */
export async function preloadVisionModels() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const [fl, od] = await Promise.all([getFaceLandmarker(), getObjectDetector()]);
      return { faceLandmarker: fl, objectDetector: od };
    } catch (err) {
      console.error("❌ Failed to preload vision models:", err);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Cleanup vision model instances and free WebAssembly/WebGL memory
 */
export function cleanupVisionModels() {
  try {
    if (faceLandmarkerInstance) {
      faceLandmarkerInstance.close();
      faceLandmarkerInstance = null;
    }
    if (objectDetectorInstance) {
      objectDetectorInstance.close();
      objectDetectorInstance = null;
    }
    initPromise = null;
    console.log("🧹 Vision models disposed successfully");
  } catch (err) {
    console.warn("Error during vision models disposal:", err.message);
  }
}
