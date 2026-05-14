export {};

declare module '@mui/material/FormControl' {
  interface FormControlPropsSizeOverrides {
    large: true;
  }
}

declare module '@mui/material/TextField' {
  interface TextFieldPropsSizeOverrides {
    large: true;
  }
}

declare module '@mui/material/Select' {
  interface SelectPropsSizeOverrides {
    large: true;
  }
}

declare module '@mui/material/InputBase' {
  interface InputBasePropsSizeOverrides {
    large: true;
  }
}

declare module '@mui/material/OutlinedInput' {
  interface OutlinedInputPropsSizeOverrides {
    large: true;
  }
}
