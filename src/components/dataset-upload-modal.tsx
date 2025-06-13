"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TagInput } from "@/components/ui/tag-input"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api/index"
import type { DatasetUploadParams } from "@/lib/api/types"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  file: z.instanceof(File, { message: "Please select a file" }),
})

type FormData = z.infer<typeof formSchema>

interface DatasetUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess?: () => void
}

export function DatasetUploadModal({
  open,
  onOpenChange,
  onUploadSuccess,
}: DatasetUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      tags: [],
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue("file", file)
      // Auto-fill name if empty
      if (!form.getValues("name")) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
        form.setValue("name", nameWithoutExt)
      }
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      setIsUploading(true)

      const uploadParams: DatasetUploadParams = {
        file: data.file,
        name: data.name,
        description: data.description,
        tags: data.tags?.join(", "),
      }

      const response = await api.datasets.upload(uploadParams)

      toast({
        title: "Dataset uploaded successfully",
        description: `${data.name} has been uploaded.`,
      })

      form.reset()
      onOpenChange(false)
      onUploadSuccess?.()
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload Dataset</DialogTitle>
          <DialogDescription>
            Upload a new dataset file. Supported formats include CSV, JSON, and other common data formats.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="file"
                      accept=".csv,.json,.txt,.xlsx,.xls"
                      onChange={handleFileChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Select a dataset file to upload
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Dataset" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for your dataset
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your dataset..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Add tags..."
                      maxTags={5}
                      maxChars={30}
                    />
                  </FormControl>
                  <FormDescription>
                    Press Enter to add tags. Click on tags to remove them.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}