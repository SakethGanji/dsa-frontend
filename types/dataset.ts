// src/types/dataset.ts
export interface Dataset {
    id: number;
    title: string;
    description: string;
    type: string;
    size: string;
    lastUpdated: string;
    tags: string[];
    version: string;
    downloads: number;
    uploader: string;
}