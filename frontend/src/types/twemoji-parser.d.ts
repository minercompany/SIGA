declare module 'twemoji-parser' {
    export interface EmojiEntity {
        url: string;
        indices: [number, number];
        text: string;
        type: string;
    }

    export function parse(text: string, options?: any): EmojiEntity[];
}
