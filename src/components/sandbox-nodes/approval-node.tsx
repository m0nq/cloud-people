import { Position } from '@xyflow/react';
import { ReactNode } from 'react';
import { HiOutlinePencilAlt } from 'react-icons/hi';

import './node.styles.css';
import { NodeComponent } from '@components/utils/node-component/node-component';
import { HandleType } from './types.enum';
import Image from 'next/image';
import userAvatarImage from '@public/example-avatar.png';

type ApprovalNodeProps = {
    id: string;
    data: {
        img?: string;
        name: string;
        role: string;
        onOpenModal?: () => void;
        [key: string]: any;
    };
    targetPosition?: string;
    sourcePosition?: string;
    isConnectable?: boolean;
    type?: string;
};

const getPosition = (position?: string): Position => {
    const positionMap = {
        left: Position.Left,
        right: Position.Right,
        bottom: Position.Bottom,
        top: Position.Top
    } as { [direction: string]: Position };

    return (position && positionMap[position]) || Position.Top;
};

const ApprovalNode = ({ id, data, isConnectable, sourcePosition, targetPosition }: ApprovalNodeProps): ReactNode => {
    const sPosition = getPosition(sourcePosition);
    const tPosition = getPosition(targetPosition);

    // get user data from db

    return (
        <NodeComponent.Root className="approval-node">
            <NodeComponent.Content className="approval-details-container">
                <div className="approval-header">
                    <Image src={userAvatarImage} alt={`Profile avatar of ${data.name}`} className="avatar" />
                    <div className="approval-user-content">
                        <div className="text-white font-medium">{data.name ?? 'Me'}</div>
                        <div className="text-white font-medium">Approval</div>
                    </div>
                    <HiOutlinePencilAlt className="pencil-icon" size={20} />
                </div>
                <div className="approval-body">
                    <div className="text-gray-400 text-sm mt-1">Role: {data.role ?? ''}</div>
                    <div className="text-gray-400 text-sm mt-1">Please approve or give feedback</div>
                </div>
            </NodeComponent.Content>
            <NodeComponent.Handle type={HandleType.SOURCE} position={sPosition} id={`${id}-a`}
                isConnectable={isConnectable} />
            <NodeComponent.Handle type={HandleType.TARGET} position={tPosition} id={`${id}-b`}
                isConnectable={isConnectable} />
            {/*    TODO: will need third bottom handle to connect edge to parent node.  */}
            {/*    TODO: will need approval-edge handle to connect edge to parent node with a feedback button.  */}
        </NodeComponent.Root>
    );
};

export default ApprovalNode;
