'use client'

import Link from "next/link";
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from "react";
import {IRally} from "@/db/models/rally";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import RallyVoteCarousel from "@/components/VotingOptionsRally.clent";
import { useRouter } from "next/navigation";
import RallyResults from "@/components/VoteResultsRally.client";

export default function RallyPage() {
    const { username } = useUser();
    const [rally, setRally] = useState<IRally>();
    const [submissions, setSubmissions] = useState([])
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [userUploaded, setUserUpaloaded] = useState(false)
    const [uploadCount, setUploadCount] = useState(0)
    const router = useRouter();

    useEffect(() => {
        const fetchRally = async () => {
            const response = await fetch('/api/rally');
            const data = await response.json();
            if(data.rally){
              setRally(data.rally);
              const submission = await data.rally.submissions.some((submission:any) => submission.username == username);
              await setUploadCount(data.rally.submissions.length);
              await setUserUpaloaded(submission);
              await setSubmissions(data.rally.submissions)
            }
        }
        fetchRally();
    }, [username])



    const getPresignedUrl = async (filename: string, contentType: string) => {
        const response = await fetch(
            process.env.NEXT_PUBLIC_BASE_URL + '/api/rally/uploadimage',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename, contentType, userid: username, rallyId: rally?._id}),
            }
        );

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`Failed to get pre-signed URL: ${responseText}`);
        }

        return response.json();
    };

    const uploadToS3 = async (url: string, fields: Record<string, string>, file: File) => {
        const formData = new FormData();

        Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, value as string);
        });
        formData.append('file', file);

        const uploadResponse = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!uploadResponse.ok) {
            const responseText = await uploadResponse.text();
            throw new Error(`S3 Upload Error: ${responseText}`);
        }

        return fields.key;  // Return the key to construct the image URL
    };

    const createRallySubmission = async (rallyId: string, userId: string, imageUrl: string) => {
        const response = await fetch(
            '/api/rally/submissions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rallyId,
                    userId,
                    imageUrl,
                }),
            }
        );

        if (!response.ok) {
            const responseText = await response.json();
            throw new Error(`Submission failed: ${responseText}`);
        }

        return response.json();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file) {
            alert('Please select a file to upload.');
            return;
        }

        setUploading(true);

        try {
            const { url, fields } = await getPresignedUrl(file.name, file.type);
            const key = await uploadToS3(url, fields, file);
            const imageUrl = `${url}/${key}`; // Construct the image URL
            const submissionResponse = await createRallySubmission(rally?._id as string, username, imageUrl);
            console.log('Submission successful:', submissionResponse);
            alert('Upload and submission successful!');
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setUploading(false);
            router.refresh()
        }
    };
    
    const handleVote = async () => {	
        router.refresh();
    }

    function calcTimeLeft(endTime: Date):any {
        const difference = +new Date(endTime) - +new Date();
        let timeLeft = {};
      
        if (difference > 0) {
          timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          };
        }
        
        return timeLeft;
      }

    return (
        <>
          <div className="m-6 mb-1">
                <div className="flex items-center">
                    <Link className="text-lg leading-none mr-auto cursor-pointer" href="/">
                        <ArrowLeft />
                    </Link>
                </div>
                <h1 className="text-xl font-bold text-center">Rally</h1>
                <div>
                    {rally ? (
                        <div>
                            <div className="mb-20 mt-10 text-center">
                                {rally.task}
                            </div>
                            {!rally.votingOpen && (
                                <>
                                    <div>
                                        time left: {calcTimeLeft(rally.endTime).days} days {calcTimeLeft(rally.endTime).hours} hours
                                    </div>
                                    <div>
                                        {uploadCount} images uploaded
                                    </div>
                                    {userUploaded ? (
                                        <div className="text-center text-green-500">
                                            You have already submitted an image.
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit}>
                                            <input
                                                id="file"
                                                type="file"
                                                onChange={(e) => {
                                                    const files = e.target.files;
                                                    if (files) {
                                                        setFile(files[0]);
                                                    }
                                                }}
                                                accept="image/png, image/jpeg"
                                            />
                                            <Button type="submit" disabled={uploading}>
                                                Upload
                                            </Button>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-red-500">No ongoing rally</p>
                    )}
                </div>
                {rally?.votingOpen && (
                    <div className="m-10 mt-20">
                    <RallyVoteCarousel rallyId={rally._id} onVote={handleVote} />
                    </div>
                )}
                {rally?.resultsShowing && (
                    <div className="m-10 mt-20">
                        <RallyResults submissions={submissions} />
                    </div>
                )}
            </div>
        </>
    );
}
