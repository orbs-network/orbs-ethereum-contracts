/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import { App } from '../components/App/App';
import { render } from '@testing-library/react';
import { configs } from '../config';

export class AppDriver {
  render() {
    return render(<App configs={configs} />);
  }
}
