import Image from "next/image";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
    BookmarkIcon,
    ChatBubbleIcon,
    HeartIcon,
    ImageIcon,
    MoreHorizontalIcon,
    PaperPlaneIcon,
    RetweetIcon,
    ShareIcon,
} from "./icons";

interface SocialMediaPreviewProps {
    platform: string;
    content: string;
    imageUrl?: string;
}

const user = {
    name: "Podcast Studio",
    handle: "@PODSLICE.Ai Studio",
    avatar: "bg-indigo-500",
    linkedInHeadline: "Helping creators grow their audience",
};

const ActionButton: React.FC<{ icon: React.ReactNode; label: string }> = ({
    icon,
    label,
}) => (
    <Button
        className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors duration-200"
        aria-label={label}
        onClick={() => { }}>
        {icon}
    </Button>
);

const TwitterPreview: React.FC<{ content: string; imageUrl?: string }> = ({
    content,
    imageUrl,
}) => {
    const isSimulated = imageUrl?.startsWith("data:image/svg+xml");
    return (
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 max-w-lg mx-auto font-sans">
            <div className="flex space-x-3">
                <div className={`w-12 h-12 rounded-full flex-none ${user.avatar}`} />
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                            <span className="font-bold text-white">{user.name}</span>
                            <span className="text-gray-500">{user.handle}</span>
                            <span className="text-gray-500">· 1m</span>
                        </div>
                        <MoreHorizontalIcon />
                    </div>
                    <p className="text-white whitespace-pre-wrap mt-1">{content}</p>
                    {imageUrl && (
                        <div className="mt-3 border border-gray-700 rounded-2xl overflow-hidden relative">
                            <Image
                                width={100}
                                height={100}
                                src={imageUrl}
                                alt="Generated for social media post"
                                className="w-full h-auto object-cover"
                            />
                            {!isSimulated && (
                                <div className="absolute bottom-2 right-2 bg-green-600/95 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                                    ✓ Imagen
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex justify-between mt-4 text-gray-500">
                        <ActionButton icon={<ChatBubbleIcon />} label="Reply" />
                        <ActionButton icon={<RetweetIcon />} label="Retweet" />
                        <ActionButton icon={<HeartIcon />} label="Like" />
                        <ActionButton icon={<ShareIcon />} label="Share" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const LinkedInPreview: React.FC<{ content: string; imageUrl?: string }> = ({
    content,
    imageUrl,
}) => {
    const isSimulated = imageUrl?.startsWith("data:image/svg+xml");
    return (
        <div className="bg-gray-800/80 border border-gray-700 rounded-lg max-w-lg mx-auto font-sans overflow-hidden">
            <div className="p-4">
                <div className="flex space-x-3">
                    <div className={`w-12 h-12 rounded-full flex-none ${user.avatar}`} />
                    <div className="flex-1">
                        <span className="font-semibold text-white block">{user.name}</span>
                        <span className="text-gray-400 text-xs block">{user.linkedInHeadline}</span>
                        <span className="text-gray-500 text-xs block">1h · Edited</span>
                    </div>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap mt-3 text-sm">{content}</p>
            </div>
            {imageUrl && (
                <div className="border-t border-gray-700 relative">
                    <Image
                        width={100}
                        height={100}
                        src={imageUrl}
                        alt="Generated for social media post"
                        className="w-full h-auto object-cover"
                    />
                    {!isSimulated && (
                        <div className="absolute bottom-2 right-2 bg-green-600/95 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                            ✓ Imagen
                        </div>
                    )}
                </div>
            )}
            <div className="border-t border-gray-700 px-4 py-2 flex justify-around">
                <ActionButton icon={<HeartIcon />} label="Like" />
                <ActionButton icon={<ChatBubbleIcon />} label="Comment" />
                <ActionButton icon={<RetweetIcon />} label="Repost" />
                <ActionButton icon={<PaperPlaneIcon />} label="Send" />
            </div>
        </div>
    );
};

const InstagramPreview: React.FC<{ content: string; imageUrl?: string }> = ({
    content,
    imageUrl,
}) => {
    const isSimulated = imageUrl?.startsWith("data:image/svg+xml");
    return (
        <div className="bg-black border border-gray-700 rounded-xl max-w-sm mx-auto font-sans overflow-hidden">
            <div className="p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div
                        className={`w-8 h-8 rounded-full p-0.5 bg-linear-to-tr from-yellow-400 to-pink-600 ${user.avatar}`} />

                    <span className="font-semibold text-white text-sm">{user.handle}</span>
                </div>
                <MoreHorizontalIcon />
            </div>
            <div className="w-full aspect-square bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                {imageUrl ? (
                    <>
                        <Image
                            width={100}
                            height={100}
                            src={imageUrl}
                            alt="Generated for social media post"
                            className="w-full h-full object-cover"
                        />
                        {!isSimulated && (
                            <div className="absolute bottom-2 right-2 bg-green-600/95 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                                ✓ Imagen
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-gray-500">
                        <ImageIcon />
                    </div>
                )}
            </div>
            <div className="p-3">
                <div className="flex justify-between items-center">
                    <div className="flex space-x-4">
                        <HeartIcon />
                        <ChatBubbleIcon />
                        <PaperPlaneIcon />
                    </div>
                    <BookmarkIcon />
                </div>
                <p className="text-white whitespace-pre-wrap mt-3 text-sm">
                    <span className="font-semibold">{user.handle}</span> {content}
                </p>
                <span className="text-gray-500 text-xs uppercase mt-2 block">
                    View all comments
                </span>
            </div>
        </div>
    );
};

export const SocialMediaPreview: React.FC<SocialMediaPreviewProps> = ({
    platform,
    content,
    imageUrl,
}) => {
    const isSimulated = imageUrl?.startsWith("data:image/svg+xml");
    switch (platform) {
        case "Twitter":
            return <TwitterPreview content={content} imageUrl={imageUrl} />;
        case "LinkedIn":
            return <LinkedInPreview content={content} imageUrl={imageUrl} />;
        case "Instagram":
            return <InstagramPreview content={content} imageUrl={imageUrl} />;
        default:
            return (
                <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700">
                    <h4 className="font-bold text-gray-200">{platform}</h4>
                    <p className="text-gray-300 whitespace-pre-wrap mt-1">{content}</p>
                    {imageUrl && (
                        <div className="relative mt-2">
                            <Image
                                width={100}
                                height={100}
                                src={imageUrl}
                                alt="Generated for social media post"
                                className="rounded-lg"
                            />
                            {!isSimulated && (
                                <div className="absolute bottom-2 right-2 bg-green-600/95 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                                    ✓ Imagen
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
    }
};
