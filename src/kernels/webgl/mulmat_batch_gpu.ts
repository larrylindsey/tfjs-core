import {GPGPUProgram} from'./gpgpu_math';

export class MatMulProgram implements GPGPUProgram {
  variableNames = ['matrixA', 'matrixB'];
  outputShape: number[];
  userCode: string;

  constructor(
    aShape: [number, number, number], bShape: [number, number, number], transposeA = false, transposeB = false) {
    const batchSize = aShape[0];
    const outerShapeA = transposeA ? aShape[2] : aShape[1];
    const outerShapeB = transposeB ? bShape[1] : bShape[2];
    const sharedDim = transposeA ? aShape[1] : aShape[2];
    this.outputShape = [batchSize, outerShapeA, outerShapeB];

    const aSnippetFromOffset = (vec4Offset: number, indexVar: string|number) =>
        transposeA ? `${indexVar} + ${vec4Offset}, aRow, batch` :
                     `batch, aRow, ${indexVar} + ${vec4Offset}`;
    const bSnippetFromOffset = (vec4Offset: number, indexVar: string|number) =>
        transposeB ? `bCol, ${indexVar} + ${vec4Offset}, batch` :
                     `batch, ${indexVar} + ${vec4Offset}, bCol`;

    const sharedDimNearestVec4 = Math.floor(sharedDim / 4) * 4;
    const sharedDimVec4Remainder = sharedDim % 4;

    this.userCode = ` float dotARowBCol(int batch, int aRow, int bCol) {
      float result = 0.0;
      for (int i = 0; i < ${sharedDimNearestVec4}; i += 4) {
        vec4 a = vec4(
          getMatrixA(${aSnippetFromOffset(0, 'i')}),
          getMatrixA(${aSnippetFromOffset(1, 'i')}),
          getMatrixA(${aSnippetFromOffset(2, 'i')}),
          getMatrixA(${aSnippetFromOffset(3, 'i')})
        );
        vec4 b = vec4(
          getMatrixB(${bSnippetFromOffset(0, 'i')}),
          getMatrixB(${bSnippetFromOffset(1, 'i')}),
          getMatrixB(${bSnippetFromOffset(2, 'i')}),
          getMatrixB(${bSnippetFromOffset(3, 'i')})
        );        

        result += dot(a, b);
      }

      if (${sharedDimVec4Remainder === 1}) {
        result += getMatrixA(${aSnippetFromOffset(0, sharedDimNearestVec4)}) *
          getMatrixB(${bSnippetFromOffset(0, sharedDimNearestVec4)});
      } else if (${sharedDimVec4Remainder === 2}) {
        vec2 a = vec2(
          getMatrixA(${aSnippetFromOffset(0, sharedDimNearestVec4)}),
          getMatrixA(${aSnippetFromOffset(1, sharedDimNearestVec4)})
        );
        vec2 b = vec2(
          getMatrixB(${bSnippetFromOffset(0, sharedDimNearestVec4)}),
          getMatrixB(${bSnippetFromOffset(1, sharedDimNearestVec4)})
        );
        result += dot(a, b);
      } else if (${sharedDimVec4Remainder === 3}) {
        vec3 a = vec3(
          getMatrixA(${aSnippetFromOffset(0, sharedDimNearestVec4)}),
          getMatrixA(${aSnippetFromOffset(1, sharedDimNearestVec4)}),
          getMatrixA(${aSnippetFromOffset(2, sharedDimNearestVec4)})
        );
        vec3 b = vec3(
          getMatrixB(${bSnippetFromOffset(0, sharedDimNearestVec4)}),
          getMatrixB(${bSnippetFromOffset(1, sharedDimNearestVec4)}),
          getMatrixB(${bSnippetFromOffset(2, sharedDimNearestVec4)})
        );
        result += dot(a, b);
      }

      return result;
    }

    void main() {
      ivec3 resBRC = getOutputCoords();
      setOutput(dotARowBCol(resBRC.x, resBRC.y, resBRC.z));
    }
    `;
  }
}