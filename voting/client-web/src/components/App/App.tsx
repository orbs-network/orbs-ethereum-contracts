/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import { QueryParamProvider } from 'use-query-params';
import { Route } from 'react-router-dom';
import classNames from 'classnames';
import { WithStyles } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { LangRouter } from '../multi-lang/LangRouter';
import { IConfig } from '../../config';
import { ApiContext } from '../../services/ApiContext';
import { resources } from '../../translations';
import { Header } from '../Header/Header';
import { Main } from '../Main/Main';
import { ThemeProvider } from './ThemeProvider';
import { useServices } from '../../services/ServicesHooks';

interface IProps {
  configs: IConfig;
}

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    backgroundColor: '#06142e',
    backgroundRepeat: 'repeat-y',
    backgroundImage: 'url(https://www.orbs.com/wp-content/uploads/2019/02/technology-background1.png)',
    backgroundAttachment: 'scroll',
    backgroundPosition: 'top center',
    minHeight: '100vh',
  },
  glass: {
    backgroundColor: 'black',
    width: '100%',
    height: '100%',
    opacity: 0.7,
    zIndex: 100000,
    position: 'absolute' as any,
    top: 0,
    left: 0,
  },
  glassLabel: {
    width: '100%',
    height: '100%',
    zIndex: 100001,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute' as any,
    top: 0,
    left: 0,
  },
  blurred: {
    filter: 'blur(2px)',
  },
}));

export const App = React.memo<IProps>(props => {
  const classes = useStyles();
  const { configs } = props;
  const services = useServices();

  return (
    <LangRouter preLangBasename={process.env.PUBLIC_URL} resources={resources}>
      <QueryParamProvider ReactRouterRoute={Route}>
        <ThemeProvider>
          {/* DEV_NOTE : O.L : This provider is the old-form manual provider */}
          {/* TODO : O.L: Change all services to use the standard provider and hooks */}

          <CssBaseline />
          <div
            className={classNames({
              [classes.root]: true,
            })}
            data-testid='container'
          >
            <Header />
            <Main />
          </div>
        </ThemeProvider>
      </QueryParamProvider>
    </LangRouter>
  );
});
