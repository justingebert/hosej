import Header from '@/components/ui/Header';
import cat from '/public/cat.jpg';
import Image from 'next/image'
import Link from 'next/link';

export default function HelpPage() {
    return (
        <>
            <Header href={`/groups`}/>
            <Image src={cat} alt="cat" className="rounded-lg" />
            <div>
                <Link href={"/terms"}>Terms of Service</Link>    
            </div>
            <div>
                <Link href={"/privacy"}>Privacy Policy</Link>
            </div>
        </>
    );
}