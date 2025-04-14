# Content Research and Writing Workflow Test Strategy

## Overview

This document outlines a testing strategy for implementing and validating the data passing mechanism between two agents in a workflow: a Content Research Agent and a Content Writer Agent. This test case is designed to be straightforward while demonstrating the core functionality of data passing between workflow agents.

## Workflow Description

### Agent 1: Content Research Agent

**Purpose**: Research a specific topic and create a structured outline with key points and references.

**Input**: A topic to research.

**Output**: Structured research data including topic details, key points, and references.

### Agent 2: Content Writer Agent

**Purpose**: Take the research data and create a draft document or article.

**Input**: Research data from Agent 1.

**Output**: A completed draft document with formatted content.

## Test Data

### Agent 1: Content Research Agent

#### Task Description

```
Research the topic "The Impact of Artificial Intelligence on Business Processes" and create a comprehensive outline. 

Your research should include:
1. A clear title for the article
2. 4-6 key sections or points to cover
3. At least 3 relevant sources (websites, articles, or studies)
4. A brief description of the target audience
5. Potential keywords for SEO

Organize your findings in a structured format that can be used by a content writer.
```

#### Expected Output Format

```json
{
  "version": "1.0",
  "timestamp": "2025-04-04T10:20:05-07:00",
  "data": {
    "title": "The Impact of Artificial Intelligence on Business Processes: A 2025 Perspective",
    "targetAudience": "Business executives, IT managers, and process improvement specialists",
    "keySections": [
      {
        "heading": "Current State of AI in Business Process Automation",
        "points": [
          "Overview of AI adoption rates across industries",
          "Common business processes being automated with AI",
          "Case studies of successful implementations"
        ]
      },
      {
        "heading": "Benefits of AI-Driven Process Optimization",
        "points": [
          "Efficiency improvements and cost reduction",
          "Error reduction and quality enhancement",
          "Scalability and adaptability to changing conditions"
        ]
      },
      {
        "heading": "Implementation Challenges and Solutions",
        "points": [
          "Technical integration with legacy systems",
          "Data quality and preparation requirements",
          "Change management and employee training"
        ]
      },
      {
        "heading": "Future Trends in AI for Business Processes",
        "points": [
          "Emerging technologies and approaches",
          "Predictive vs. prescriptive process optimization",
          "Ethical considerations and governance"
        ]
      },
      {
        "heading": "Measuring ROI and Success Metrics",
        "points": [
          "Key performance indicators for AI implementations",
          "Short-term vs. long-term benefits",
          "Continuous improvement methodologies"
        ]
      }
    ],
    "sources": [
      {
        "title": "AI and the Future of Business Process Management",
        "url": "https://hbr.org/artificial-intelligence-business-processes",
        "publisher": "Harvard Business Review"
      },
      {
        "title": "2025 Global AI Business Survey",
        "url": "https://www.mckinsey.com/ai-business-survey-2025",
        "publisher": "McKinsey & Company"
      },
      {
        "title": "Implementing AI for Business Process Automation",
        "url": "https://www.gartner.com/ai-process-automation-guide",
        "publisher": "Gartner"
      }
    ],
    "seoKeywords": [
      "AI business process optimization",
      "artificial intelligence workflow automation",
      "AI ROI business",
      "intelligent process automation",
      "business AI implementation"
    ]
  }
}
```

### Agent 2: Content Writer Agent

#### Task Description

```
Write a comprehensive article based on the research outline provided. The article should be well-structured, engaging, and informative. Include an introduction, body sections following the outline, and a conclusion.

Formatting requirements:
1. Use proper headings and subheadings
2. Include a brief executive summary at the beginning
3. Incorporate the sources as in-text citations and a references section
4. Target length: 1200-1500 words
5. Write in a professional but accessible tone appropriate for the target audience

Deliver the article as formatted text that could be published on a business technology blog.
```

#### Expected Output Format

```json
{
  "version": "1.0",
  "timestamp": "2025-04-04T10:45:12-07:00",
  "data": {
    "title": "The Impact of Artificial Intelligence on Business Processes: A 2025 Perspective",
    "executiveSummary": "This article explores how artificial intelligence is transforming business processes across industries, highlighting benefits, implementation challenges, and future trends. Drawing on recent research and case studies, we provide a comprehensive overview for business leaders looking to leverage AI for process optimization.",
    "wordCount": 1350,
    "content": "# The Impact of Artificial Intelligence on Business Processes: A 2025 Perspective\n\n## Executive Summary\n\nThis article explores how artificial intelligence is transforming business processes across industries, highlighting benefits, implementation challenges, and future trends. Drawing on recent research and case studies, we provide a comprehensive overview for business leaders looking to leverage AI for process optimization.\n\n## Introduction\n\n[Full article content would be here...]\n\n## References\n\n1. Harvard Business Review. (2025). AI and the Future of Business Process Management. https://hbr.org/artificial-intelligence-business-processes\n\n2. McKinsey & Company. (2025). 2025 Global AI Business Survey. https://www.mckinsey.com/ai-business-survey-2025\n\n3. Gartner. (2025). Implementing AI for Business Process Automation. https://www.gartner.com/ai-process-automation-guide",
    "targetKeywords": [
      "AI business process optimization",
      "artificial intelligence workflow automation",
      "intelligent process automation"
    ]
  }
}
```

## Testing Strategy

### Phase 1: Initial Setup and Agent Configuration

1. **Create Agent Definitions**:
   - Create the Content Research Agent with appropriate description and tools
   - Create the Content Writer Agent with appropriate description and tools
   - Configure both agents with the necessary permissions for web browsing

2. **Create Workflow**:
   - Create a new workflow with a root node
   - Add the Content Research Agent as the first node
   - Add the Content Writer Agent as the second node
   - Connect the nodes in sequence

### Phase 2: Agent Task Testing (Individual)

1. **Test Content Research Agent**:
   - Run the agent in isolation with the test task description
   - Verify it can successfully research the topic
   - Confirm it produces output in the expected format
   - Manually inspect the output for quality and completeness

2. **Test Content Writer Agent**:
   - Run the agent in isolation with a manually provided research outline
   - Verify it can successfully create an article
   - Confirm it produces output in the expected format
   - Manually inspect the output for quality and completeness

### Phase 3: Data Passing Implementation Testing

1. **Implement Agent Store Enhancements**:
   - Add result storage to agent state
   - Implement the `setAgentResult` and `getAgentResult` methods
   - Test these methods in isolation

2. **Implement Workflow Context**:
   - Add workflow context to the workflow store
   - Implement methods to update and access the workflow context
   - Test these methods in isolation

3. **Enhance Use-Agent Hook**:
   - Update `executeTask` to include previous agent output
   - Add error handling and retry logic
   - Test with mock data

4. **Update Browser Service**:
   - Modify the TaskRequest model to include previous output
   - Update the agent adapter to use previous output
   - Test with mock requests

### Phase 4: End-to-End Workflow Testing

1. **Run Complete Workflow**:
   - Start the workflow with the Content Research Agent
   - Verify it completes successfully and transitions to the Content Writer Agent
   - Verify the Content Writer Agent receives the research data
   - Confirm the final article is generated successfully

2. **Validation Checks**:
   - Verify data integrity throughout the workflow
   - Check that the article references information from the research
   - Confirm all expected data fields are passed correctly

3. **Error Handling Tests**:
   - Test with intentionally malformed research data
   - Simulate network errors during data passing
   - Verify retry mechanisms work correctly
   - Confirm appropriate error states are displayed

### Phase 5: UI and Monitoring Testing

1. **Test Data Visualization Component**:
   - Implement the WorkflowDataViewer component
   - Verify it displays the data passed between agents
   - Check that it updates in real-time as the workflow progresses

2. **Test Telemetry**:
   - Implement the tracking functions
   - Verify events are logged correctly
   - Check that success/failure metrics are accurate

## Success Criteria

1. **Functional Requirements**:
   - Content Research Agent successfully produces structured research data
   - Content Writer Agent receives the research data without manual intervention
   - Content Writer Agent uses the research data to create an article
   - The final article incorporates elements from the research (sections, sources, etc.)

2. **Technical Requirements**:
   - Data is properly validated at each step
   - Error handling works correctly
   - State updates are immutable
   - Telemetry captures all relevant events
   - UI components accurately reflect the workflow state

3. **Performance Requirements**:
   - Data passing adds minimal overhead to workflow execution
   - Retry mechanisms don't significantly delay workflow completion
   - UI remains responsive during data operations

## Debugging Tips

1. Use the WorkflowDataViewer component to inspect data at each step
2. Check browser console logs for telemetry events
3. Verify the structure of data in the workflow context
4. Examine agent state transitions for unexpected behavior
5. Use browser developer tools to monitor network requests

## Next Steps After Successful Testing

1. Expand to more complex workflows with additional agents
2. Implement data transformation capabilities between agents
3. Add support for different data types (images, files, etc.)
4. Enhance error recovery mechanisms
5. Develop more sophisticated data visualization tools
