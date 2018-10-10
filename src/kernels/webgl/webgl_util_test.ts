/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {describeWithFlags} from '../../jasmine_util';
import {WEBGL_ENVS} from '../../test_util';

import * as gpgpu_util from './gpgpu_util';
import {TextureUsage} from './tex_util';
import * as webgl_util from './webgl_util';

describeWithFlags('getTextureShapeFromLogicalShape', WEBGL_ENVS, () => {
  let gl: WebGLRenderingContext;

  beforeEach(() => {
    gl = gpgpu_util.createWebGLContext();
  });

  it('scalar', () => {
    const texShape = webgl_util.getTextureShapeFromLogicalShape(gl, []);
    expect(texShape).toEqual([1, 1]);
  });

  it('1d', () => {
    const texShape = webgl_util.getTextureShapeFromLogicalShape(gl, [4]);
    expect(texShape).toEqual([4, 1]);
  });

  it('2d stays same', () => {
    let texShape = webgl_util.getTextureShapeFromLogicalShape(gl, [5, 2]);
    expect(texShape).toEqual([5, 2]);

    texShape = webgl_util.getTextureShapeFromLogicalShape(gl, [5, 1]);
    expect(texShape).toEqual([5, 1]);

    texShape = webgl_util.getTextureShapeFromLogicalShape(gl, [1, 5]);
    expect(texShape).toEqual([1, 5]);
  });

  it('3d 2x3x4', () => {
    const texShape = webgl_util.getTextureShapeFromLogicalShape(gl, [2, 3, 4]);
    expect(texShape).toEqual([6, 4]);
  });

  it('3d 3x256x256', () => {
    const texShape =
        webgl_util.getTextureShapeFromLogicalShape(gl, [3, 256, 256]);
    expect(texShape).toEqual([3 * 256, 256]);
  });

  it('3d 2x1x4 got squeezed', () => {
    const texShape = webgl_util.getTextureShapeFromLogicalShape(gl, [2, 1, 4]);
    expect(texShape).toEqual([2, 4]);
  });

  it('3d 1x8x2 got squeezed', () => {
    const texShape = webgl_util.getTextureShapeFromLogicalShape(gl, [1, 8, 2]);
    expect(texShape).toEqual([8, 2]);
  });

  it('4d 2x2x256x256 got squeezed', () => {
    const texShape =
        webgl_util.getTextureShapeFromLogicalShape(gl, [2, 2, 256, 256]);
    expect(texShape).toEqual([2 * 2 * 256, 256]);
  });

  it('4d 1x8x1x3 got squeezed', () => {
    const texShape =
        webgl_util.getTextureShapeFromLogicalShape(gl, [1, 8, 1, 3]);
    expect(texShape).toEqual([8, 3]);
  });

  it('4d 1x3x1x8 got squeezed', () => {
    const texShape =
        webgl_util.getTextureShapeFromLogicalShape(gl, [1, 3, 1, 8]);
    expect(texShape).toEqual([3, 8]);
  });

  it('packed textures less than 2x max size of platform do not get squeezed',
     () => {
       const max = webgl_util.queryMaxTextureSize(gl);
       const logicalShape = [2, max + 1];
       const texShape = webgl_util.getTextureShapeFromLogicalShape(
           gl, logicalShape, TextureUsage.PACK);
       expect(texShape).toEqual(logicalShape);
     });
});
