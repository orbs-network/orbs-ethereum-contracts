import { createMuiTheme } from '@material-ui/core/styles';

export default createMuiTheme({
  palette: {
    type: 'dark',
    primary: { main: '#09142c' },
    secondary: { main: '#74f6fd' },
    background: {
      default: '#0a0f25',
      paper: '#192a45'
    }
  },
  typography: {
    useNextVariants: true
  }
});
