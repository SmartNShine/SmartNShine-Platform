/**
 * Gaze & Head Pose Calculator using MediaPipe FaceLandmarker 3D points and blendshapes
 */

/**
 * Extracts head pose Euler angles (yaw, pitch, roll in degrees)
 * from MediaPipe's facial transformation matrix.
 */
export function extractHeadPose(transformationMatrixData) {
  if (!transformationMatrixData || transformationMatrixData.length < 16) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const m = transformationMatrixData;

  // Euler angles calculation from standard 4x4 column-major or row-major transformation matrix
  // MediaPipe provides row-major 4x4 matrix
  const yaw = Math.atan2(m[4], m[0]) * (180 / Math.PI);
  const pitch = Math.atan2(-m[8], Math.sqrt(m[9] * m[9] + m[10] * m[10])) * (180 / Math.PI);
  const roll = Math.atan2(m[9], m[10]) * (180 / Math.PI);

  return {
    yaw: Math.round(yaw * 10) / 10,
    pitch: Math.round(pitch * 10) / 10,
    roll: Math.round(roll * 10) / 10,
  };
}

/**
 * Evaluates eye glance deviation using MediaPipe Face Blendshapes.
 * Returns a score 0-1 indicating deviation and the dominant direction.
 */
export function extractGazeFromBlendshapes(blendshapes) {
  if (!blendshapes || !blendshapes.categories) {
    return { isGlancingAway: false, deviationScore: 0, direction: "center" };
  }

  const shapeMap = {};
  for (const cat of blendshapes.categories) {
    shapeMap[cat.categoryName] = cat.score;
  }

  const lookDown = ((shapeMap["eyeLookDownLeft"] || 0) + (shapeMap["eyeLookDownRight"] || 0)) / 2;
  const lookUp = ((shapeMap["eyeLookUpLeft"] || 0) + (shapeMap["eyeLookUpRight"] || 0)) / 2;
  const lookLeft = ((shapeMap["eyeLookOutLeft"] || 0) + (shapeMap["eyeLookInRight"] || 0)) / 2;
  const lookRight = ((shapeMap["eyeLookInLeft"] || 0) + (shapeMap["eyeLookOutRight"] || 0)) / 2;

  let dominantDirection = "center";
  let maxScore = 0;

  if (lookDown > 0.55 && lookDown > maxScore) {
    dominantDirection = "down";
    maxScore = lookDown;
  }
  if (lookLeft > 0.55 && lookLeft > maxScore) {
    dominantDirection = "left";
    maxScore = lookLeft;
  }
  if (lookRight > 0.55 && lookRight > maxScore) {
    dominantDirection = "right";
    maxScore = lookRight;
  }
  if (lookUp > 0.55 && lookUp > maxScore) {
    dominantDirection = "up";
    maxScore = lookUp;
  }

  const isGlancingAway = maxScore >= 0.55;

  return {
    isGlancingAway,
    deviationScore: Math.round(maxScore * 100) / 100,
    direction: dominantDirection,
  };
}

/**
 * Combined head pose + eye gaze assessment.
 * Returns true if the candidate's visual attention is diverted away from the screen.
 */
export function isAttentionDiverted({ headPose, gazeBlendshape }) {
  const { yaw, pitch } = headPose;

  // Head turned left/right past 24 degrees
  const isHeadYawDiverted = Math.abs(yaw) > 24;

  // Head tilted down (e.g. towards desk/lap) past 20 degrees or up past 22 degrees
  const isHeadPitchDiverted = pitch > 20 || pitch < -22;

  // Eyes glancing sideways or down even with head straight
  const isEyeGlancing = gazeBlendshape.isGlancingAway;

  const isDiverted = isHeadYawDiverted || isHeadPitchDiverted || isEyeGlancing;

  let reason = "";
  if (isHeadYawDiverted) {
    reason = yaw > 0 ? "Head turned right" : "Head turned left";
  } else if (isHeadPitchDiverted) {
    reason = pitch > 0 ? "Looking down at desk" : "Looking up";
  } else if (isEyeGlancing) {
    reason = `Eyes focused ${gazeBlendshape.direction}`;
  }

  return {
    isDiverted,
    reason,
    headPose,
    gazeBlendshape,
  };
}
