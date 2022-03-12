import React, { SyntheticEvent } from "react";
import { connect } from "react-redux";
import { Snackbar, IconButton, Button } from "@mui/material";
import { clearAppMessage } from "../state/actions";
import { Close } from "@mui/icons-material";
import defaultState from "../state/default-state";

interface Action {
  text: string;
  cb: (...args: any[]) => any;
}

interface Message {
  message: string;
  open: boolean;
  action: Action | null;
}

interface AppToastProps {
  message: Message;
  dispatch: any;
}

const AppToast = (props: AppToastProps) => {
  const { message } = props;
  const action = message && message.action;

  const handleClose: any = (_: Event | SyntheticEvent, reason: string) => {
    if (reason === "clickaway") {
      return;
    }

    props.dispatch(clearAppMessage());
  };

  const getActionButtonsArray = () => {
    const actionButtonsArray = [
      <IconButton
        key="close"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <Close />
      </IconButton>,
    ];
    if (action) {
      actionButtonsArray.unshift(
        <Button
          key="action"
          color="secondary"
          size="small"
          onClick={message.action!.cb}
        >
          {message.action!.text}
        </Button>
      );
    }

    return actionButtonsArray;
  };

  return (
    <>
      {message && (
        <Snackbar
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          open={message.open}
          autoHideDuration={6000}
          onClose={handleClose}
          message={<span>{message.message}</span>}
          action={getActionButtonsArray()}
        />
      )}
    </>
  );
};

const mapStateToProps = (state: typeof defaultState) => ({
  message: state.message,
});

const mapDispatchToProps = (dispatch: any) => ({
  dispatch: dispatch,
});

export default connect(mapStateToProps, mapDispatchToProps)(AppToast);
