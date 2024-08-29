import Header from '@/components/ui/Header';
import cat from '/public/cat.jpg';
import Image from 'next/image'

export default function HelpPage() {
    return (
        <>
            <Header href={`/groups`}/>
            <Image src={cat} alt="cat" className="rounded-lg" />
        </>
    );
}