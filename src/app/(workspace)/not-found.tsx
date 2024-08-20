import { FiFrown } from 'react-icons/fi';
//import Link from 'next/link';

const NotFound = () => {
    return (
        <main>
            <FiFrown />
            <h2>Not found!</h2>
            <p>Could not find the requested resource</p>
            {/*<Link href={}>← Go back</Link>*/}
        </main>
    );
};

export default NotFound;
