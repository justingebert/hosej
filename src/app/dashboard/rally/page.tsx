'use client'

import Link from "next/link";
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from "react";

export default function RallyPage() {
    const [rally, setRally] = useState(null);
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        const fetchRally = async () => {
            const response = await fetch('/api/rally');
            const data = await response.json();
            if(data.rally){
              setRally(data.rally);
            }
            
        }
        fetchRally();
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
    
        if (!file) {
          alert('Please select a file to upload.')
          return
        }
    
        setUploading(true)
    
        const response = await fetch(
          process.env.NEXT_PUBLIC_BASE_URL + '/api/upload',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: file.name, contentType: file.type }),
          }
        )
    
        if (response.ok) {
          const { url, fields } = await response.json()
    
          const formData = new FormData()
          Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, value as string)
          })
          formData.append('file', file)
    
          const uploadResponse = await fetch(url, {
            method: 'POST',
            body: formData,
          })
    
          if (uploadResponse.ok) {
            alert('Upload successful!')
          } else {
            console.error('S3 Upload Error:', uploadResponse)
            alert('Upload failed.')
          }
        } else {
          alert('Failed to get pre-signed URL.')
        }
    
        setUploading(false)
      }
    

    return (
        <>
        <div className="m-6 mb-1">
        <div className="flex items-center">
            <Link className="text-lg leading-none mr-auto cursor-pointer" href="/">
            <ArrowLeft/>
            </Link>
        </div>
        <h1 className="text-xl font-bold text-center">Rally</h1>
        <div>
          {rally ? (
            <form onSubmit={handleSubmit}>
            <input
              id="file"
              type="file"
              onChange={(e) => {
                const files = e.target.files
                if (files) {
                  setFile(files[0])
                }
              }}
              accept="image/png, image/jpeg"
            />
            <button type="submit" disabled={uploading}>
              Upload
            </button>
          </form>
          ):(
            <p className="text-center text-red-500">No ongoing rally</p>
          )}
          
          
        
        </div>
      </div>
        </>
    );
}