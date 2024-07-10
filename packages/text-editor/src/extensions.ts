import {
    BulletListExtension,
    DocExtension,
    DropCursorExtension,
    HeadingExtension,
    ImageAttributes,
    ImageExtension,
    LinkExtension,
    OrderedListExtension,
    ParagraphExtension,
    PlaceholderExtension,
    TaskListExtension,
    TextExtension,
    wysiwygPreset,
} from "remirror/extensions";
import { CodeMirrorExtension } from "@remirror/extension-codemirror6";
// @ts-ignore
import { TableExtension } from "@remirror/extension-react-tables";
import { languages } from "@codemirror/language-data";
import { oneDark } from "@codemirror/theme-one-dark";
import { basicSetup } from "codemirror";
import { DelayedPromiseCreator, ErrorConstant, invariant } from "remirror";
import { FetchBuilder } from "@courselit/utils";
import { Media } from "@courselit/common-models";

const wysiwygPresetArrayWithoutImageExtension = wysiwygPreset().filter(
    (extension) => extension instanceof ImageExtension !== true,
);

type SetProgress = (progress: number) => void;

interface FileWithProgress {
    file: File;
    progress: SetProgress;
}

async function getPresignedUrl(url: string) {
    const fetch = new FetchBuilder()
        .setUrl(`${url}/api/media/presigned`)
        .setIsGraphQLEndpoint(false)
        .build();
    const response = await fetch.exec();
    return response.url;
}

function getUploadHandler(url: string) {
    return function uploadFileToMediaLit(
        files: FileWithProgress[],
    ): DelayedPromiseCreator<ImageAttributes>[] {
        invariant(files.length > 0, {
            code: ErrorConstant.EXTENSION,
            message:
                "The upload handler was applied for the image extension without any valid files",
        });

        let completed = 0;
        const promises: DelayedPromiseCreator<ImageAttributes>[] = [];

        for (const { file, progress } of files) {
            promises.push(
                () =>
                    new Promise<ImageAttributes>((resolve, reject) => {
                        getPresignedUrl(url)
                            .then((presignedUrl) => {
                                const fD = new FormData();
                                fD.append("caption", file.name);
                                fD.append("access", "public");
                                fD.append("file", file);

                                return fetch(presignedUrl, {
                                    method: "POST",
                                    body: fD,
                                });
                            })
                            .then((data) => data.json())
                            .then((data: Media) => {
                                completed += 1;
                                progress(completed / files.length);
                                resolve({
                                    src: data.file,
                                    fileName: data.originalFileName,
                                });
                            })
                            .catch((err) => reject(err));
                    }),
            );
        }
        return promises;
    };
}

export const getExtensions = (placeholder, url) => () => [
    new DocExtension({}),
    new TextExtension(),
    new ParagraphExtension(),
    new HeadingExtension({}),
    new BulletListExtension({}),
    new LinkExtension({}),
    new OrderedListExtension(),
    new PlaceholderExtension({ placeholder }),
    new TableExtension(),
    new TaskListExtension(),
    new ImageExtension({
        enableResizing: true,
        uploadHandler: getUploadHandler(url),
    }),
    new DropCursorExtension(),
    new CodeMirrorExtension({
        languages: languages,
        extensions: [basicSetup, oneDark],
    }),
    ...wysiwygPresetArrayWithoutImageExtension,
];
