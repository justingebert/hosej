"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { IRally } from "@/db/models/rally";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/UserContext";
import RallyVoteCarousel from "@/components/Rally/VotingOptionsRally.client";
import { useRouter, useSearchParams } from "next/navigation";
import RallyResults from "@/components/Rally/VoteResultsRally.client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipLoader } from "react-spinners";
import imageCompression from 'browser-image-compression';
import BackLink from "@/components/BackLink";

function RallyTabs({ rallies, userHasVoted, userHasUploaded, setUserHasVoted }: any) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('returnTo') || (rallies.length > 0 ? rallies[0]._id : undefined);

  return (
    <Tabs defaultValue={defaultTab}>
      <div className="flex justify-center mt-5">
        <TabsList>
          {rallies.map((rally: any, index: number) => (
            <TabsTrigger key={rally._id} value={rally._id}>
              {"Rally " + (index + 1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {rallies.map((rally: any) => (
        <TabsContent key={rally._id} value={rally._id}>
          <RallyTabContent rally={rally} userHasVoted={userHasVoted} userHasUploaded={userHasUploaded} setUserHasVoted={setUserHasVoted} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function RallyTabContent({ rally, userHasVoted, userHasUploaded,setUserHasVoted }: any) {
  const { username } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const getPresignedUrl = async (filename: string, contentType: string) => {
    const response = await fetch("/api/rally/uploadimage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename,
        contentType,
        userid: username,
        rallyId: rally._id,
      }),
    });

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

  const createRallySubmission = async (rallyId: string, userId: string, imageUrl: string) => {
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
      // Compress and resize the image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      console.log(`Original file size: ${file.size / 1024 / 1024} MB`);
      console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB`);

      const { url, fields } = await getPresignedUrl(compressedFile.name, compressedFile.type);
      const key = await uploadToS3(url, fields, compressedFile);
      const imageUrl = `${url}/${key}`; // Construct the image URL
      const submissionResponse = await createRallySubmission(
        rally._id,
        username,
        imageUrl
      );
      console.log("Submission successful:", submissionResponse);
      alert("Upload and submission successful!"); //TODO improve
      setUserHasVoted((prev: any) => ({ ...prev, [rally._id]: true }));
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setUploading(false);
      router.refresh();
    }
  };

  const handleVote = async () => {
    setUserHasVoted((prev: any) => ({ ...prev, [rally._id]: true }));
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
      <h2 className="mt-5 text-lg text-center">{rally.task}</h2>
      {!rally.votingOpen && (
        <div>
          <div className="mt-5 text-xs text-center">
            {calcTimeLeft(rally.endTime).days} days{" "}
            {calcTimeLeft(rally.endTime).hours} hours left
          </div>

          <Card className="mt-20">
            <CardContent className="p-2">
              {userHasUploaded[rally._id] ? (
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
          <div className="absolute bottom-5 left-0 right-0 text-center">
            {rally.submissions.length} uploads
          </div>
        </div>
      )}
      {rally.votingOpen &&
        (userHasVoted[rally._id] ? (
          <div className="mt-5">
            <RallyResults rallyId={rally._id} />
          </div>
        ) : (
          <div className="mt-10">
            <RallyVoteCarousel rallyId={rally._id} onVote={handleVote} />
          </div>
        ))}
    </>
  );
}

const RallyPage = () => {
  const { username } = useUser();
  const [rallies, setRallies] = useState<any[]>([]);
  const [userHasVoted, setUserHasVoted] = useState<any>({});
  const [userUploaded, setUserUploaded] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    const fetchRallies = async () => {
      router.refresh();
      const res = await fetch("/api/rally", { cache: "no-store" });
      const data = await res.json();

      if (data.rallies) {
        setRallies(data.rallies);
        const votes = data.rallies.reduce((acc: any, rally: any) => {
          acc[rally._id] = rally.submissions.some((submission: any) =>
            submission.votes.some((vote: any) => vote.username === username)
          );
          return acc;
        }, {});
        setUserHasVoted(votes);
        const userHasUploaded = data.rallies.reduce((acc: any, rally: any) => {
          acc[rally._id] = rally.submissions.some((submission: any) =>
            submission.username === username
          );
          return acc;
        }, {});
        setUserUploaded(userHasUploaded);
      }
      if (data.message) {
        alert(data.message); //TODO improve
      }
    };

    if (username) {
      fetchRallies();
    }
  }, [username, router]);

  return (
    <>
      <BackLink href={'/'} />
      <h1 className="text-xl font-bold text-center">Rallies</h1>
      {rallies.length > 0 ? (
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <ClipLoader size={50} color={"FFFFFF"} loading={true} />
          </div>
        }>
          <RallyTabs
            rallies={rallies}
            userHasVoted={userHasVoted}
            userHasUploaded={userUploaded}
            setUserHasVoted={setUserHasVoted}
          />
        </Suspense>
      ) : (
        <div className="flex items-center justify-center ">
          <ClipLoader size={50} color={"FFFFFF"} loading={true} />
        </div>
      )}
    </>
  );
};

export default RallyPage;
