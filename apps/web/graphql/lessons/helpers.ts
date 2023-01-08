import { responses } from "../../config/strings";
import constants from "../../config/constants";
import LessonModel, { Lesson } from "../../models/Lesson";
import CourseModel from "../../models/Course";
import { Group, Question, Quiz } from "@courselit/common-models";
import mongoose from "mongoose";
import { LessonWithStringContent } from "./logic";
const { text, audio, video, pdf, embed, quiz, file } = constants;

type LessonValidatorProps = Pick<
    LessonWithStringContent,
    "content" | "type" | "media"
>;

export const lessonValidator = (lessonData: LessonValidatorProps) => {
    validateTextContent(lessonData);
    validateMediaContent(lessonData);
};

function validateTextContent(lessonData: LessonValidatorProps) {
    const content = lessonData.content ? JSON.parse(lessonData.content) : null;

    if ([text, embed].includes(lessonData.type)) {
        if (
            lessonData.type === text &&
            content &&
            typeof content === "object"
        ) {
            return;
        }
        if (lessonData.type === embed && content && content.value) {
            return;
        }

        throw new Error(responses.content_cannot_be_null);
    }

    if (lessonData.type === quiz) {
        if (content && content.questions) {
            validateQuizContent(content.questions);
        }
    }
}

function validateQuizContent(questions: Question[]) {
    for (const question of questions) {
        let correctAnswersCount = question.options.filter(
            (option) => option.correctAnswer
        ).length;
        if (correctAnswersCount === 0) {
            throw new Error(responses.no_correct_answer);
        }
        let optionsWithNoText = question.options.filter(
            (option) => !option.text
        ).length;
        if (optionsWithNoText) {
            throw new Error(responses.no_empty_option);
        }
    }
}

function validateMediaContent(lessonData: LessonValidatorProps) {
    if (
        (lessonData.type === audio ||
            lessonData.type === video ||
            lessonData.type === file ||
            lessonData.type === pdf) &&
        !(lessonData.media && lessonData.media.mediaId)
    ) {
        throw new Error(responses.media_id_cannot_be_null);
    }
}

type GroupLessonItem = Pick<Lesson, "lessonId" | "groupId" | "groupRank">;
export const getGroupedLessons = async (
    courseId: string,
    domainId: mongoose.Types.ObjectId
): Promise<GroupLessonItem[]> => {
    const course = await CourseModel.findOne({
        courseId: courseId,
        domain: domainId,
    });
    const allLessons = await LessonModel.find<GroupLessonItem>(
        {
            lessonId: {
                $in: [...course.lessons],
            },
            domain: domainId,
        },
        {
            lessonId: 1,
            groupRank: 1,
            groupId: 1,
        }
    );
    const lessonsInSequentialOrder = [];
    for (let group of course.groups.sort(
        (a: Group, b: Group) => a.rank - b.rank
    )) {
        lessonsInSequentialOrder.push(
            ...allLessons
                .filter(
                    (lesson: GroupLessonItem) => lesson.groupId === group.id
                )
                .sort(
                    (a: GroupLessonItem, b: GroupLessonItem) =>
                        a.groupRank - b.groupRank
                )
        );
    }
    return lessonsInSequentialOrder;
};

export const getPrevNextCursor = async (
    courseId: string,
    domainId: mongoose.Types.ObjectId,
    lessonId?: string
) => {
    const lessonsInSequentialOrder = await getGroupedLessons(
        courseId,
        domainId
    );
    const indexOfCurrentLesson = lessonId
        ? lessonsInSequentialOrder.findIndex(
              (item) => item.lessonId === lessonId
          )
        : -1;

    return {
        prevLesson:
            indexOfCurrentLesson - 1 < 0
                ? ""
                : lessonsInSequentialOrder[indexOfCurrentLesson - 1].lessonId,
        nextLesson:
            indexOfCurrentLesson + 1 > lessonsInSequentialOrder.length - 1
                ? ""
                : lessonsInSequentialOrder[indexOfCurrentLesson + 1].lessonId,
    };
};

export function evaluateLessonResult(content: Quiz, answers: number[][]) {
    let userScore = 0;
    let actualScore = 0;
    console.log(answers, content.questions);

    for (
        let questionIndex = 0;
        questionIndex < content.questions.length;
        questionIndex++
    ) {
        const question = content.questions[questionIndex];
        const userAnswersForThisQuestion = answers[questionIndex] || [];
        console.log(question, userAnswersForThisQuestion);

        for (
            let optionIndex = 0;
            optionIndex < question.options.length;
            optionIndex++
        ) {
            const isCorrectAnswer = question.options[optionIndex].correctAnswer;
            if (isCorrectAnswer) {
                actualScore += 1;
                const userAnswerContainsThisOption =
                    userAnswersForThisQuestion.indexOf(optionIndex) !== -1;
                if (userAnswerContainsThisOption) {
                    userScore += 1;
                }
            }
        }
    }

    const userScoreInPercentage = (userScore / actualScore) * 100;
    let pass = true;
    if (content.requiresPassingGrade) {
        if (userScoreInPercentage < content.passingGrade) {
            pass = false;
        }
    }

    return {
        pass,
        score: userScoreInPercentage,
    };
}
