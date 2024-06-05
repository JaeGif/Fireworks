uniform float uSize;

void main() {

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    
    gl_Position = projectionMatrix * viewPosition;

    // final size
    gl_PointSize = uSize;
    gl_PointSize *= 1.0 / - viewPosition.z;
}