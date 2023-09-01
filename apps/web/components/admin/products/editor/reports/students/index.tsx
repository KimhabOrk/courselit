import React from "react";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import {
    COURSE_STUDENT_NO_RECORDS,
    COURSE_STUDENT_REPORT_HEADER,
    COURSE_STUDENT_SEARCH_BY_TEXT,
    COURSE_STUDENT_TABLE_HEADER_DOWNLOAD,
    COURSE_STUDENT_TABLE_HEADER_LAST_ACCESSED_ON,
    COURSE_STUDENT_TABLE_HEADER_PROGRESS,
    COURSE_STUDENT_TABLE_HEADER_SIGNED_UP_ON,
    PRICING_EMAIL,
    USER_TABLE_HEADER_NAME,
} from "../../../../../../ui-config/strings";
import { TextField } from "@mui/material";
import { ChangeEvent, useEffect, useState } from "react";
import { FetchBuilder } from "@courselit/utils";
import {
    actionCreators,
    AppDispatch,
    AppState,
} from "@courselit/state-management";
import { connect } from "react-redux";
import { Address } from "@courselit/common-models";
import { Search, Circle, CheckCircled } from "@courselit/icons";
import useCourse from "../../course-hook";
import { Dialog2, IconButton, Link } from "@courselit/components-library";
const { networkAction } = actionCreators;

interface StudentsProps {
    course: ReturnType<typeof useCourse>;
    address: Address;
    dispatch: AppDispatch;
    loading: boolean;
}

interface Student {
    userId: string;
    email: string;
    name: string;
    progress: string[];
    signedUpOn: number;
    lastAccessedOn: number;
}

function Students({ course, address, dispatch, loading }: StudentsProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [text, setText] = useState("");
    const [progressDialogOpened, setProgressDialogOpened] = useState(false);
    const [student, setStudent] = useState<Student>();

    useEffect(() => {
        if (course?.courseId) {
            fetchStudents();
        }
    }, [course]);

    const fetchStudents = async () => {
        const mutation = text
            ? `
            query {
                report: getReports(id: "${course?.courseId}") {
                    students (text: "${text}") {
                        email,
                        userId,
                        name,
                        progress,
                        signedUpOn,
                        lastAccessedOn,
                        downloaded
                    }
                }
            }
            `
            : `
            query {
                report: getReports(id: "${course?.courseId}") {
                    students {
                        email,
                        userId,
                        name,
                        progress,
                        signedUpOn,
                        lastAccessedOn,
                        downloaded
                    }
                }
            }
            `;
        const fetch = new FetchBuilder()
            .setUrl(`${address.backend}/api/graph`)
            .setPayload(mutation)
            .setIsGraphQLEndpoint(true)
            .build();
        try {
            dispatch(networkAction(true));
            const response = await fetch.exec();
            setStudents(response.report.students);
        } finally {
            dispatch(networkAction(false));
        }
    };

    const onKeyDown = (e: any) => {
        if (e.keyCode === 13) {
            fetchStudents();
        }
    };

    const showProgress = (student: Student) => {
        setStudent(student);
        setProgressDialogOpened(true);
    };

    const resetActiveStudent = () => {
        setStudent(undefined);
        setProgressDialogOpened(false);
    };

    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography variant="subtitle1" sx={{ fontWeight: "bolder" }}>
                    {COURSE_STUDENT_REPORT_HEADER}
                </Typography>
            </Grid>
            <Grid item>
                <TextField
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setText(e.target.value)
                    }
                    value={text}
                    placeholder={COURSE_STUDENT_SEARCH_BY_TEXT}
                    fullWidth
                    InputProps={{
                        endAdornment: (
                            <IconButton onClick={fetchStudents} variant="soft">
                                <Search />
                            </IconButton>
                        ),
                    }}
                    onKeyDown={onKeyDown}
                    disabled={loading}
                />
            </Grid>
            <Grid item>
                <TableContainer>
                    <Table aria-label="Course students">
                        <TableHead>
                            <TableRow>
                                <TableCell>{USER_TABLE_HEADER_NAME}</TableCell>
                                {course?.costType?.toLowerCase() !==
                                    PRICING_EMAIL && (
                                    <TableCell>
                                        {COURSE_STUDENT_TABLE_HEADER_PROGRESS}
                                    </TableCell>
                                )}
                                {course?.costType?.toLowerCase() ===
                                    PRICING_EMAIL && (
                                    <TableCell>
                                        {COURSE_STUDENT_TABLE_HEADER_DOWNLOAD}
                                    </TableCell>
                                )}
                                <TableCell>
                                    {COURSE_STUDENT_TABLE_HEADER_SIGNED_UP_ON}
                                </TableCell>
                                <TableCell>
                                    {
                                        COURSE_STUDENT_TABLE_HEADER_LAST_ACCESSED_ON
                                    }
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student: any) => (
                                <TableRow key={student.email as string}>
                                    <TableCell>
                                        <Link
                                            href={`/dashboard/users/${student.userId}`}
                                        >
                                            {student.name ||
                                                (student.email as string)}
                                        </Link>
                                    </TableCell>
                                    {course?.costType?.toLowerCase() !==
                                        PRICING_EMAIL && (
                                        <TableCell>
                                            <Dialog2
                                                title={`${
                                                    student!.name ||
                                                    student!.email
                                                }'s Progress`}
                                                trigger={
                                                    <span className="cursor-pointer w-full">
                                                        {
                                                            (
                                                                student.progress as string[]
                                                            ).length
                                                        }{" "}
                                                        /{" "}
                                                        {
                                                            course?.lessons
                                                                ?.length
                                                        }
                                                    </span>
                                                }
                                            >
                                                {course?.lessons?.map(
                                                    (lesson: any) => (
                                                        <div
                                                            key={
                                                                lesson.lessonId
                                                            }
                                                            className="flex justify-between items-center mb-1"
                                                        >
                                                            <p>
                                                                {lesson.title}
                                                            </p>
                                                            <span>
                                                                {student.progress.includes(
                                                                    lesson.lessonId,
                                                                ) ? (
                                                                    <CheckCircled />
                                                                ) : (
                                                                    <Circle />
                                                                )}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </Dialog2>
                                        </TableCell>
                                    )}
                                    {course?.costType?.toLowerCase() ===
                                        PRICING_EMAIL && (
                                        <TableCell>
                                            {student.downloaded && (
                                                <CheckCircled />
                                            )}
                                            {!student.downloaded && <></>}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        {student.signedUpOn
                                            ? new Date(
                                                  student.signedUpOn as number,
                                              ).toLocaleDateString()
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {student.lastAccessedOn
                                            ? new Date(
                                                  student.lastAccessedOn as number,
                                              ).toLocaleDateString()
                                            : "-"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
            {!students.length && (
                <Grid container justifyContent="center" sx={{ mt: 2 }}>
                    <Grid item>
                        <Typography variant="subtitle1">
                            {COURSE_STUDENT_NO_RECORDS}
                        </Typography>
                    </Grid>
                </Grid>
            )}
            {/*
            {student && (
                <Dialog
                    open={progressDialogOpened}
                    onClose={resetActiveStudent}
                >
                    <DialogTitle>
                        <b>{student!.name || student!.email}</b>&apos;s Progress
                    </DialogTitle>
                    <DialogContent>
                        {course?.lessons?.map((lesson: any) => (
                            <ListItem key={lesson.lessonId}>
                                <ListItemText>{lesson.title}</ListItemText>
                                <ListItemIcon>
                                    {student.progress.includes(
                                        lesson.lessonId,
                                    ) ? (
                                        <CheckCircled />
                                    ) : (
                                        <Circle />
                                    )}
                                </ListItemIcon>
                            </ListItem>
                        ))}
                    </DialogContent>
                </Dialog>
            )}
            */}
        </Grid>
    );
}

const mapStateToProps = (state: AppState) => ({
    address: state.address,
    loading: state.networkAction,
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({ dispatch });

export default connect(mapStateToProps, mapDispatchToProps)(Students);
