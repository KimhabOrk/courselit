import React from "react";
import { Section } from "@courselit/components-library";
import {
    Button,
    Checkbox,
    Grid,
    InputAdornment,
    TextField,
    Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
    LESSON_QUIZ_ADD_QUESTION,
    LESSON_QUIZ_GRADED_TEXT,
    LESSON_QUIZ_PASSING_GRADE_LABEL,
    LESSON_QUIZ_QUESION_PLACEHOLDER,
} from "../../../../../../ui-config/strings";
import { QuestionBuilder } from "./question-builder";
import { Question, Quiz } from "@courselit/common-models";
import { DEFAULT_PASSING_GRADE } from "../../../../../../ui-config/constants";

interface QuizBuilderProps {
    content: Quiz;
    onChange: (...args: any[]) => void;
}

export function QuizBuilder({ content, onChange }: QuizBuilderProps) {
    const [questions, setQuestions] = useState<Question[]>(
        (content && content.questions) || [
            {
                text: `${LESSON_QUIZ_QUESION_PLACEHOLDER} #1`,
                options: [{ text: "", correctAnswer: false }],
            },
        ]
    );
    const [passingGradeRequired, setPassingGradeRequired] = useState(
        (content && content.requiresPassingGrade) || false
    );
    const [passingGradePercentage, setPassingGradePercentage] = useState(
        (content && content.passingGrade) || DEFAULT_PASSING_GRADE
    );

    useEffect(() => {
        content.questions && setQuestions(content.questions);
        content.passingGrade && setPassingGradePercentage(content.passingGrade);
        content.requiresPassingGrade &&
            setPassingGradeRequired(content.requiresPassingGrade);
    }, [content]);

    useEffect(() => {
        onChange({
            questions,
            requiresPassingGrade: passingGradeRequired,
            passingGrade: passingGradePercentage,
        });
    }, [questions, passingGradeRequired, passingGradePercentage]);

    const addNewOption = (index: number) => {
        const question = questions[index];
        question.options = [
            ...question.options,
            { text: "", correctAnswer: false },
        ];
        setQuestions([...questions]);
    };

    const setCorrectAnswer =
        (questionIndex: number) => (index: number, checked: boolean) => {
            questions[questionIndex].options[index].correctAnswer = checked;
            setQuestions([...questions]);
        };

    const setOptionText =
        (questionIndex: number) => (index: number, text: string) => {
            questions[questionIndex].options[index].text = text;
            setQuestions([...questions]);
        };

    const setQuestionText = (index: number) => (text: string) => {
        questions[index].text = text;
        setQuestions([...questions]);
    };

    const removeOption = (questionIndex: number) => (index: number) => {
        questions[questionIndex].options.splice(index, 1);
        setQuestions([...questions]);
    };

    const addNewQuestion = () =>
        setQuestions([
            ...questions,
            {
                text: `${LESSON_QUIZ_QUESION_PLACEHOLDER} #${
                    questions.length + 1
                }`,
                options: [{ text: "", correctAnswer: false }],
            },
        ]);

    return (
        <Grid container direction="column">
            {questions.map((question: Question, index: number) => (
                <Grid
                    item
                    sx={{
                        marginBottom: 2,
                    }}
                    key={index}
                >
                    <Section>
                        <QuestionBuilder
                            details={questions[index]}
                            index={index}
                            removeOption={() => removeOption(index)}
                            setQuestionText={setQuestionText(index)}
                            setOptionText={setOptionText(index)}
                            setCorrectOption={setCorrectAnswer(index)}
                            addNewOption={() => addNewOption(index)}
                        />
                    </Section>
                </Grid>
            ))}
            <Grid
                item
                sx={{
                    marginBottom: 2,
                }}
            >
                <Button onClick={addNewQuestion} variant="contained">
                    {LESSON_QUIZ_ADD_QUESTION}
                </Button>
            </Grid>
            <Grid item>
                <Grid container alignItems="center">
                    <Grid item>
                        <Checkbox
                            checked={passingGradeRequired}
                            onChange={(e) =>
                                setPassingGradeRequired(e.target.checked)
                            }
                        />
                    </Grid>
                    <Grid item xs>
                        <Typography>{LESSON_QUIZ_GRADED_TEXT}</Typography>
                    </Grid>
                    <Grid item>
                        <TextField
                            size="small"
                            type="number"
                            label={LESSON_QUIZ_PASSING_GRADE_LABEL}
                            value={passingGradePercentage}
                            onChange={(e) =>
                                setPassingGradePercentage(
                                    parseInt(e.target.value)
                                )
                            }
                            InputLabelProps={{ shrink: true }}
                            disabled={!passingGradeRequired}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        %
                                    </InputAdornment>
                                ),
                                inputProps: {
                                    min: 0,
                                    max: 100,
                                },
                            }}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
}
