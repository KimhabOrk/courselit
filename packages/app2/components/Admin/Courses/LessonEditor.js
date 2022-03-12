import React, { useState, useEffect } from "react";
import { styled } from '@mui/material/styles';
import PropTypes from "prop-types";
import {
  Button,
  TextField,
  Typography,
  Grid,
  Switch,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  capitalize,
} from "@mui/material";
import {
  BUTTON_SAVE,
  BUTTON_DELETE_LESSON_TEXT,
  DOWNLOADABLE_SWITCH,
  TYPE_DROPDOWN,
  LESSON_CONTENT_HEADER,
  CONTENT_URL_LABEL,
  LESSON_REQUIRES_ENROLLMENT,
  DELETE_LESSON_POPUP_HEADER,
  POPUP_CANCEL_ACTION,
  POPUP_OK_ACTION,
  APP_MESSAGE_LESSON_DELETED,
  APP_MESSAGE_LESSON_SAVED,
} from "../../../config/strings";
import {
  lesson as lessonType,
  authProps,
  addressProps,
} from "../../../types.js";
import {
  LESSON_TYPE_TEXT,
  LESSON_TYPE_AUDIO,
  LESSON_TYPE_VIDEO,
  LESSON_TYPE_PDF,
  LESSON_TYPE_QUIZ,
  MIMETYPE_VIDEO,
  MIMETYPE_AUDIO,
  MIMETYPE_PDF,
} from "../../../config/constants.js";
import FetchBuilder from "../../../lib/fetch";
import { networkAction, setAppMessage } from "../../../redux/actions";
import { connect } from "react-redux";
import AppMessage from "../../../models/app-message.js";
import { Section, RichText as TextEditor } from "../../ComponentsLibrary";
import dynamic from "next/dynamic";

const PREFIX = 'LessonEditor';

const classes = {
  formControl: `${PREFIX}-formControl`,
  controlRow: `${PREFIX}-controlRow`,
  editor: `${PREFIX}-editor`,
  editorLabel: `${PREFIX}-editorLabel`,
  section: `${PREFIX}-section`
};

const StyledSection = styled(Section)((
  {
    theme
  }
) => ({
  [`& .${classes.formControl}`]: {
    marginBottom: theme.spacing(2),
    minWidth: "100%",
  },

  [`& .${classes.controlRow}`]: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    display: "flex",
    alignItems: "center",
  },

  [`& .${classes.editor}`]: {
    border: "1px solid #cacaca",
    borderRadius: "6px",
    padding: "10px 8px",
    maxHeight: 300,
    overflow: "auto",
    marginBottom: theme.spacing(2),
  },

  [`& .${classes.editorLabel}`]: {
    fontSize: "1em",
    marginBottom: theme.spacing(1),
  },

  [`& .${classes.section}`]: {
    background: "white",
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  }
}));

const AppDialog = dynamic(() => import("../../Public/AppDialog"));
const MediaSelector = dynamic(() => import("../Media/MediaSelector"));
const AppLoader = dynamic(() => import("../../AppLoader"));

const LessonEditor = (props) => {
  const [lesson, setLesson] = useState(props.lesson);

  const inputLabel = React.useRef(null);
  const [labelWidth, setLabelWidth] = React.useState(0);
  const [deleteLessonPopupOpened, setDeleteLessonPopupOpened] = useState(false);

  useEffect(() => {
    setLabelWidth(inputLabel.current && inputLabel.current.offsetWidth);
  }, [lesson.type]);

  useEffect(() => {
    props.lesson.id && loadLesson(props.lesson.id);
  }, [props.lesson.id]);

  useEffect(() => {
    setLesson(props.lesson);
  }, [props.lesson]);

  const loadLesson = async (id) => {
    const query = `
    query {
      lesson: getLesson(id: "${id}") {
        id,
        title,
        downloadable,
        type,
        content,
        media {
          id,
          file,
          originalFileName,
          caption,
          thumbnail
        },
        requiresEnrollment
      }
    }
    `;

    const fetch = new FetchBuilder()
      .setUrl(`${props.address.backend}/graph`)
      .setPayload(query)
      .setIsGraphQLEndpoint(true)
      .setAuthToken(props.auth.token)
      .build();

    try {
      props.dispatch(networkAction(true));
      const response = await fetch.exec();
      if (response.lesson) {
        setLesson(
          Object.assign({}, response.lesson, {
            content: TextEditor.hydrate({ data: response.lesson.content }),
          })
        );
      }
    } catch (err) {
      // setError(err.message)
    } finally {
      props.dispatch(networkAction(false));
    }
  };

  const onLessonCreate = async (e) => {
    e.preventDefault();

    if (lesson.id) {
      await updateLesson();
    } else {
      await createLesson();
    }
  };

  const updateLesson = async () => {
    const query = `
    mutation {
      lesson: updateLesson(lessonData: {
        id: "${lesson.id}"
        title: "${lesson.title}",
        downloadable: ${lesson.downloadable},
        type: ${lesson.type.toUpperCase()},
        content: "${TextEditor.stringify(lesson.content)}",
        mediaId: ${
          lesson.media && lesson.media.id ? '"' + lesson.media.id + '"' : null
        },
        requiresEnrollment: ${lesson.requiresEnrollment}
      }) {
        id,
        title,
        downloadable,
        type,
        content,
        media {
          id,
          file,
          originalFileName,
          caption,
          thumbnail
        },
        requiresEnrollment
      }
    }
    `;
    const fetch = new FetchBuilder()
      .setUrl(`${props.address.backend}/graph`)
      .setPayload(query)
      .setIsGraphQLEndpoint(true)
      .setAuthToken(props.auth.token)
      .build();

    try {
      props.dispatch(networkAction(true));
      await fetch.exec();
      props.dispatch(setAppMessage(new AppMessage(APP_MESSAGE_LESSON_SAVED)));
      props.onLessonUpdated();
    } catch (err) {
      props.dispatch(setAppMessage(new AppMessage(err.message)));
    } finally {
      props.dispatch(networkAction(false));
    }
  };

  const createLesson = async () => {
    const query = `
    mutation {
      lesson: createLesson(lessonData: {
        title: "${lesson.title}",
        downloadable: ${lesson.downloadable},
        type: ${lesson.type.toUpperCase()},
        content: "${TextEditor.stringify(lesson.content)}",
        mediaId: ${
          lesson.media && lesson.media.id ? '"' + lesson.media.id + '"' : null
        },
        courseId: "${lesson.courseId}",
        requiresEnrollment: ${lesson.requiresEnrollment},
        groupId: "${lesson.groupId}"
      }) {
        id
      }
    }
    `;
    const fetch = new FetchBuilder()
      .setUrl(`${props.address.backend}/graph`)
      .setPayload(query)
      .setIsGraphQLEndpoint(true)
      .setAuthToken(props.auth.token)
      .build();

    try {
      props.dispatch(networkAction(true));
      const response = await fetch.exec();

      if (response.lesson) {
        setLesson(Object.assign({}, lesson, { id: response.lesson.id }));
        props.onLessonUpdated();
        props.dispatch(setAppMessage(new AppMessage(APP_MESSAGE_LESSON_SAVED)));
      }
    } catch (err) {
      props.dispatch(setAppMessage(new AppMessage(err.message)));
    } finally {
      props.dispatch(networkAction(false));
    }
  };

  const onLessonDelete = async (index) => {
    setDeleteLessonPopupOpened(false);

    if (lesson.id) {
      const query = `
      mutation r {
        result: deleteLesson(id: "${lesson.id}")
      }
      `;
      const fetch = new FetchBuilder()
        .setUrl(`${props.address.backend}/graph`)
        .setPayload(query)
        .setIsGraphQLEndpoint(true)
        .setAuthToken(props.auth.token)
        .build();

      try {
        props.dispatch(networkAction(true));
        const response = await fetch.exec();

        if (response.result) {
          props.dispatch(
            setAppMessage(new AppMessage(APP_MESSAGE_LESSON_DELETED))
          );
          props.onLessonUpdated(true);
        }
      } catch (err) {
        props.dispatch(setAppMessage(new AppMessage(err.message)));
      }
    }
  };

  const onLessonDetailsChange = (e) =>
    setLesson(
      Object.assign({}, lesson, {
        [e.target.name]:
          e.target.type === "checkbox" ? e.target.checked : e.target.value,
      })
    );

  const changeTextContent = (editorState) =>
    setLesson(Object.assign({}, lesson, { content: editorState }));

  const closeDeleteLessonPopup = () => setDeleteLessonPopupOpened(false);

  const getMimeTypesToShow = () => {
    if (lesson.type === String.prototype.toUpperCase.call(LESSON_TYPE_VIDEO)) {
      return MIMETYPE_VIDEO;
    }
    if (lesson.type === String.prototype.toUpperCase.call(LESSON_TYPE_AUDIO)) {
      return MIMETYPE_AUDIO;
    }
    if (lesson.type === String.prototype.toUpperCase.call(LESSON_TYPE_PDF)) {
      return MIMETYPE_PDF;
    }
  };

  return (
    <StyledSection>
      {lesson.type && (
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <form>
              <TextField
                required
                variant="outlined"
                label="Title"
                fullWidth
                margin="normal"
                name="title"
                value={lesson.title}
                onChange={onLessonDetailsChange}
                className={classes.formControl}
              />
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel ref={inputLabel} id="select-type">
                  {TYPE_DROPDOWN}
                </InputLabel>
                <Select
                  labelId="select-type"
                  value={lesson.type}
                  onChange={onLessonDetailsChange}
                  labelWidth={labelWidth}
                  inputProps={{
                    name: "type",
                  }}
                >
                  {/* <MenuItem value="TEXT">Text</MenuItem> */}
                  <MenuItem
                    value={String.prototype.toUpperCase.call(LESSON_TYPE_TEXT)}
                  >
                    {capitalize(LESSON_TYPE_TEXT)}
                  </MenuItem>
                  <MenuItem
                    value={String.prototype.toUpperCase.call(LESSON_TYPE_VIDEO)}
                  >
                    {capitalize(LESSON_TYPE_VIDEO)}
                  </MenuItem>
                  <MenuItem
                    value={String.prototype.toUpperCase.call(LESSON_TYPE_AUDIO)}
                  >
                    {capitalize(LESSON_TYPE_AUDIO)}
                  </MenuItem>
                  <MenuItem
                    value={String.prototype.toUpperCase.call(LESSON_TYPE_PDF)}
                  >
                    {capitalize(LESSON_TYPE_PDF)}
                  </MenuItem>
                  {/* <MenuItem value={LESSON_TYPE_QUIZ}>
                {capitalize(LESSON_TYPE_QUIZ)}
              </MenuItem> */}
                </Select>
              </FormControl>
              {![
                String.prototype.toUpperCase.call(LESSON_TYPE_TEXT),
                String.prototype.toUpperCase.call(LESSON_TYPE_QUIZ),
              ].includes(lesson.type) && (
                <div className={classes.formControl}>
                  <MediaSelector
                    title={CONTENT_URL_LABEL}
                    src={lesson.media && lesson.media.thumbnail}
                    onSelection={(media) =>
                      media && setLesson(Object.assign({}, lesson, { media }))
                    }
                    mimeTypesToShow={getMimeTypesToShow()}
                  />
                </div>
              )}
              {lesson.type.toLowerCase() === LESSON_TYPE_TEXT && (
                <Grid
                  container
                  className={classes.formControl}
                  direction="column"
                >
                  <Grid item>
                    <Typography variant="body1">
                      {LESSON_CONTENT_HEADER}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <TextEditor
                      initialContentState={lesson.content}
                      onChange={changeTextContent}
                    />
                  </Grid>
                </Grid>
              )}
              {[LESSON_TYPE_VIDEO, LESSON_TYPE_AUDIO, LESSON_TYPE_PDF].includes(
                lesson.type
              ) && (
                <Grid
                  container
                  justifyContent="space-between"
                  alignItems="center"
                  className={classes.formControl}
                >
                  <Grid item>
                    <Typography variant="body1">
                      {DOWNLOADABLE_SWITCH}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Switch
                      type="checkbox"
                      name="downloadable"
                      checked={lesson.downloadable}
                      onChange={onLessonDetailsChange}
                    />
                  </Grid>
                </Grid>
              )}
              <Grid
                container
                justifyContent="space-between"
                alignItems="center"
                className={classes.formControl}
              >
                <Grid item>
                  <Typography variant="body1" color="textSecondary">
                    {LESSON_REQUIRES_ENROLLMENT}
                  </Typography>
                </Grid>
                <Grid item>
                  <Switch
                    type="checkbox"
                    name="requiresEnrollment"
                    checked={lesson.requiresEnrollment}
                    onChange={onLessonDetailsChange}
                  />
                </Grid>
              </Grid>
            </form>
          </Grid>
          <Grid item>
            <Grid container direction="row" spacing={2}>
              <Grid item>
                <Button onClick={onLessonCreate}>{BUTTON_SAVE}</Button>
              </Grid>
              <Grid item>
                <Button onClick={() => setDeleteLessonPopupOpened(true)}>
                  {BUTTON_DELETE_LESSON_TEXT}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
      {!lesson.type && <AppLoader />}
      <AppDialog
        onOpen={deleteLessonPopupOpened}
        onClose={closeDeleteLessonPopup}
        title={DELETE_LESSON_POPUP_HEADER}
        actions={[
          { name: POPUP_CANCEL_ACTION, callback: closeDeleteLessonPopup },
          { name: POPUP_OK_ACTION, callback: onLessonDelete },
        ]}
      ></AppDialog>
    </StyledSection>
  );
};

LessonEditor.propTypes = {
  auth: authProps,
  dispatch: PropTypes.func.isRequired,
  lesson: lessonType,
  address: addressProps,
  onLessonUpdated: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  address: state.address,
});

const mapDispatchToProps = (dispatch) => ({
  dispatch: dispatch,
});

export default connect(mapStateToProps, mapDispatchToProps)(LessonEditor);
