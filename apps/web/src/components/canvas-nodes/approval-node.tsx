import { Position } from '@xyflow/react';
import { ReactNode } from 'react';
import { useState } from 'react';
import { HiOutlinePencilAlt } from 'react-icons/hi';
import { BiLike } from 'react-icons/bi';
import { BiDislike } from 'react-icons/bi';

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
        approvalState?: 'pending' | 'approved' | 'rejected';
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

/*
 * ApprovalNode will have 3 states to display
 * Approval Pending: base colors already set
 * Approved: thumbs up icon background color changed to background: linear-gradient(89deg, #5F42F1 14.21%, #502DFF 101.01%);
 * Rejected: thumbs down icon background color changed to background: linear-gradient(89deg, #5F42F1 14.21%, #502DFF 101.01%);
 * */
const ApprovalNode = ({ id, data, isConnectable, sourcePosition, targetPosition }: ApprovalNodeProps): ReactNode => {
    const sPosition = getPosition(sourcePosition);
    const tPosition = getPosition(targetPosition);
    const [approvalState, setApprovalState] = useState<'pending' | 'approved' | 'rejected'>(
        data.approvalState || 'pending'
    );

    const handleApprove = () => {
        setApprovalState('approved');
    };

    const handleReject = () => {
        setApprovalState('rejected');
    };

    const getButtonStyle = (type: 'approve' | 'reject') => {
        const baseStyle = 'approval-button';
        if (type === 'approve' && approvalState === 'approved') {
            return `${baseStyle} approval-button-approved`;
        }
        if (type === 'reject' && approvalState === 'rejected') {
            return `${baseStyle} approval-button-rejected`;
        }
        return baseStyle;
    };

    return (
        <NodeComponent.Root className="approval-node">
            <NodeComponent.Content className="approval-details-container">
                <div className="approval-header">
                    <Image src={userAvatarImage}
                        alt={`Profile avatar of ${data.name || 'current user'}`}
                        className="avatar" />
                    <div className="approval-user-content">
                        <div className="text-white font-medium">{data.name ?? 'Me'}</div>
                        <div className="text-white font-medium">Approval</div>
                    </div>
                    <HiOutlinePencilAlt className="pencil-icon" size={20}
                        onClick={() => alert('Something magical just happened! ✨')} />
                </div>
                <div className="approval-body">
                    <div className="text-gray-400 text-sm mt-1">Role: {data.role ?? ''}</div>
                    <div className="text-gray-400 text-sm mt-1">Please approve or give feedback</div>
                </div>
            </NodeComponent.Content>
            <div className="approval-buttons">
                <button className={getButtonStyle('approve')} onClick={handleApprove}>
                    <BiLike size={24} color="#fff" />
                </button>
                <button className={getButtonStyle('reject')} onClick={handleReject}>
                    <BiDislike size={24} color="#fff" />
                </button>
            </div>
            <NodeComponent.Handle type={HandleType.SOURCE} position={sPosition} id={`${id}-a`}
                isConnectable={isConnectable} />
            <NodeComponent.Handle type={HandleType.TARGET} position={tPosition} id={`${id}-b`}
                isConnectable={isConnectable} />
            <NodeComponent.Handle type={HandleType.SOURCE} position={Position.Bottom} id={`${id}-c`}
                isConnectable={isConnectable} />
            {/*    TODO: will need the bottom handle to connect edge to parent node.  */}
            {/*    TODO: will need approval-edge to connect an edge to parent node with a feedback button.  */}
        </NodeComponent.Root>
    );
};

export default ApprovalNode;
