"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { IRally } from "@/db/models/rally";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import RallyVoteCarousel from "@/components/Rally/VotingOptionsRally.clent";
import { useRouter } from "next/navigation";
import RallyResults from "@/components/Rally/VoteResultsRally.client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RallyPage() {
  const { username } = useUser();
  const [rally, setRally] = useState<IRally>();
  const [submissions, setSubmissions] = useState([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userUploaded, setUserUpaloaded] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchRally = async () => {
      const response = await fetch("/api/rally");
      const data = await response.json();
      if (data.rally) {
        setRally(data.rally);
        const submission = await data.rally.submissions.some(
          (submission: any) => submission.username == username
        );
        await setUploadCount(data.rally.submissions.length);
        await setUserUpaloaded(submission);
        await setSubmissions(data.rally.submissions);
      }
    };
    fetchRally();
  }, [username]);

  const getPresignedUrl = async (filename: string, contentType: string) => {
    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + "/api/rally/uploadimage",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename,
          contentType,
          userid: username,
          rallyId: rally?._id,
        }),
      }
    );

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Failed to get pre-signed URL: ${responseText}`);
    }

    return response.json();
  };

  const uploadToS3 = async (
    url: string,
    fields: Record<string, string>,
    file: File
  ) => {
    const formData = new FormData();

    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append("file", file);

    const uploadResponse = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const responseText = await uploadResponse.text();
      throw new Error(`S3 Upload Error: ${responseText}`);
    }

    return fields.key; // Return the key to construct the image URL
  };

  const createRallySubmission = async (
    rallyId: string,
    userId: string,
    imageUrl: string
  ) => {
    const response = await fetch("/api/rally/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rallyId,
        userId,
        imageUrl,
      }),
    });

    if (!response.ok) {
      const responseText = await response.json();
      throw new Error(`Submission failed: ${responseText}`);
    }

    return response.json();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    setUploading(true);

    try {
      const { url, fields } = await getPresignedUrl(file.name, file.type);
      const key = await uploadToS3(url, fields, file);
      const imageUrl = `${url}/${key}`; // Construct the image URL
      const submissionResponse = await createRallySubmission(
        rally?._id as string,
        username,
        imageUrl
      );
      console.log("Submission successful:", submissionResponse);
      alert("Upload and submission successful!"); //TODO improve
      setUserUpaloaded(true)
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setUploading(false);
      router.refresh();
    }
  };

  const handleVote = async () => {
    router.refresh();
  };

  function calcTimeLeft(endTime: Date): any {
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
      <div className="m-4 mb-1">
        <div className="flex items-center">
          <Link
            className="text-lg leading-none mr-auto cursor-pointer"
            href="/"
          >
            <ArrowLeft />
          </Link>
        </div>
        <h1 className="text-xl font-bold text-center">Rally</h1>
        <div >
          {rally ? (
            <div>
              <h2 className="mt-5 text-lg text-center">{rally.task}</h2>
              {!rally.votingOpen && !rally.resultsShowing && (
                <div>

                  <div className="mt-5 text-xs text-center">
                    {calcTimeLeft(rally.endTime).days} days{" "}
                    {calcTimeLeft(rally.endTime).hours} hours
                    left
                  </div>

                  <Card className="mt-20">
                    <CardContent className="p-2">
                      {userUploaded ? (
                        <div className="text-center text-green-500 mb-4">
                          You have already submitted an image.
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit}>
                          <Input
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
                          <div className="flex justify-center">
                          <Button
                            type="submit"
                            disabled={uploading}
                            className="mt-2 w-full"
                          >
                            Upload
                          </Button>
                          </div>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-red-500">No ongoing rally</p>
          )}
          <div className="absolute bottom-5 left-0 right-0 text-center">{uploadCount} uploads</div>
        </div>
        {rally?.votingOpen && (
          <div className="mt-10">
            <RallyVoteCarousel rallyId={rally._id} onVote={handleVote} />
          </div>
        )}
        {rally?.resultsShowing && (
          <div className="mt-5">
            <RallyResults rallyId={rally._id} />
          </div>
        )}
      </div>
    </>
  );
}
