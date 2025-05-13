// src/components/dataset-card.tsx
"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
// Updated imports for Tabler Icons
import {
    IconArrowUpRight,
    IconCalendar,
    IconDownload,
    IconFileText, // Replaced FileType with IconFileText for a generic file representation
    IconDeviceFloppy, // Replaced Save with IconDeviceFloppy for a traditional save icon
    IconUser
} from "@tabler/icons-react" // Assuming you'll install/have @tabler/icons-react

interface DatasetCardProps {
    name: string
    description: string
    version: string
    fileType: string
    fileSize: string
    lastUpdatedTimestamp: string
    uploader: string
    tags: string[]
    onView: () => void
    onDownload: () => void
    onSave: () => void
}

export const DatasetCard = ({
                                name,
                                description,
                                version,
                                fileType,
                                fileSize,
                                lastUpdatedTimestamp,
                                uploader,
                                tags,
                                onView,
                                onDownload,
                                onSave,
                            }: DatasetCardProps) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString.includes(" ") ? dateString.replace(" ", "T") : dateString);
        if (isNaN(date.getTime())) {
            return "Invalid Date";
        }
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(date)
    }

    return (
        <Card className="h-full flex flex-col gap-0 py-0">
            <CardHeader className="p-3 pb-1">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-sm line-clamp-2 flex-grow">{name}</CardTitle>
                    <Badge variant="outline" className="whitespace-nowrap">
                        v{version}
                    </Badge>
                </div>
                <CardDescription className="line-clamp-3 !mt-1">
                    {description}
                </CardDescription>
            </CardHeader>

            <CardContent className="px-4 pt-2 pb-2 flex-grow space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-sm flex items-center justify-center bg-muted">
                            {/* FileType Icon: Switched to Tabler's IconFileText, color changed to primary */}
                            <IconFileText className="h-3 w-3 text-primary" stroke={1.5} />
                        </div>
                        <span className="font-medium text-foreground">{fileType}</span>
                        <span className="mx-1">•</span>
                        <span>{fileSize}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Calendar Icon: Switched to Tabler's IconCalendar, color changed to muted-foreground */}
                        <IconCalendar className="h-3.5 w-3.5 text-muted-foreground" stroke={1.5} />
                        <span>{formatDate(lastUpdatedTimestamp)}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center flex-wrap gap-2 text-sm text-muted-foreground">
                    <div className="flex flex-wrap gap-1.5">
                        {tags.slice(0, 3).map((tag) => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs px-2 py-0.5 rounded-sm"
                            >
                                {tag}
                            </Badge>
                        ))}
                        {tags.length > 3 && (
                            <Badge
                                variant="outline"
                                className="text-xs px-2 py-0.5 rounded-sm"
                            >
                                +{tags.length - 3}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="px-4 py-2 flex justify-between items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {/* User Icon: Switched to Tabler's IconUser, color changed to muted-foreground */}
                    <IconUser className="h-3.5 w-3.5 text-muted-foreground" stroke={1.5} />
                    <span className="truncate max-w-[100px] sm:max-w-[150px]">{uploader}</span>
                </div>

                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSave} aria-label="Save">
                        {/* Save Icon: Switched to Tabler's IconDeviceFloppy, specific color class removed */}
                        <IconDeviceFloppy className="h-4 w-4" stroke={1.5} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDownload} aria-label="Download">
                        {/* Download Icon: Switched to Tabler's IconDownload, specific color class removed */}
                        <IconDownload className="h-4 w-4" stroke={1.5} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView} aria-label="View">
                        {/* ArrowUpRight Icon: Switched to Tabler's IconArrowUpRight, specific color class removed */}
                        <IconArrowUpRight className="h-4 w-4" stroke={1.5} />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}