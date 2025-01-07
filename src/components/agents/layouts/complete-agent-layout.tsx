import { BaseAgentLayout} from './base-agent-layout'
import { BaseAgentLayoutProps } from './base-agent-layout'

export const CompleteAgentLayout = (props: BaseAgentLayoutProps) => {
    const { state } = props

    return (
        <BaseAgentLayout {...props}>
            <div className="mt-4 p-3 bg-green-50 rounded-md">
                <span className="text-sm font-medium text-green-600">Completed</span>
                {state?.completedAt && (
                    <div className="mt-2">
                        <p className="text-sm text-gray-600">
                            Completed on {state.completedAt}
                        </p>
                    </div>
                )}
            </div>
        </BaseAgentLayout>
    )
}
