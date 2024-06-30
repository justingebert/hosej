'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Modal from 'react-modal';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";



const RallyResults = ({ rallyId }: any) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const response = await fetch(`/api/rally/submissions/${rallyId}`);
      const data = await response.json();
      setSubmissions(data.submissions);
    };
    fetchSubmissions();
  }, [rallyId]);

  const openModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setModalIsOpen(false);
  };

  const customStyles = {
    content: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: 'none',
      background: 'none',
      overflow: 'auto', // Ensure the content can scroll on mobile
    },
    overlay: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000, // Ensure the overlay is on top
    },
  };

  return (
    <div>
      <h1 className="text-center text-2xl font-bold mb-6">Rally Results</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {submissions.map((submission, index) => (
          <Card key={submission._id} className=" w-full">
            <CardHeader className="flex flex-col items-center">
              <CardTitle className="text-center text-sm sm:text-base md:text-lg">{submission.username}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Image
                src={submission.imageUrl}
                alt={`Submission by ${submission.username}`}
                className="object-cover w-full h-auto cursor-pointer"
                width={300}
                height={300}
                onClick={() => openModal(submission.imageUrl)}
                priority={index === 0}
              />
              <p className="mt-2 text-sm sm:text-base md:text-lg">{submission.votes.length} votes</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={modalIsOpen}
        ariaHideApp={false}
        onRequestClose={closeModal}
        contentLabel="Image Modal"
        className="flex justify-center items-center"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        style={customStyles}
      >
        {selectedImage && (
          <div className="p-4 rounded">
            <Image src={selectedImage} alt="Selected Submission" width={600} height={600} />
            <Button onClick={closeModal} className="mt-4 p-2 bg-gray-800 text-white rounded">Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RallyResults;
