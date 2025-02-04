-- apps/web/supabase/migrations/20250203234653_create_agent_system.sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE "Tools" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('browser', 'llm', 'data', 'utility')),
    parameters JSONB NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Agents" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "AgentTools" (
    agent_id UUID NOT NULL REFERENCES "Agents"(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES "Tools"(id) ON DELETE CASCADE,
    configuration JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (agent_id, tool_id)
);

CREATE TABLE "Executions" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES "Agents"(id),
    session_id UUID NOT NULL,
    input JSONB NOT NULL,
    output JSONB,
    errors JSONB,
    metrics JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "VectorMemories" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES "Agents"(id),
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "IDX_Tools_Category" ON "Tools" (category);
CREATE INDEX "IDX_AgentTools_Agent" ON "AgentTools" (agent_id);
CREATE INDEX "IDX_Executions_Session" ON "Executions" (session_id);
CREATE INDEX "IDX_VectorMemories_Agent" ON "VectorMemories" (agent_id);

-- Enable Row Level Security
ALTER TABLE "Tools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentTools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Executions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VectorMemories" ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Agents Owner Access" ON "Agents"
    USING ((config->>'owner_id')::UUID = auth.uid())
    WITH CHECK ((config->>'owner_id')::UUID = auth.uid());

CREATE POLICY "Tools Restricted Access" ON "Tools"
    USING (EXISTS (
        SELECT 1 FROM "AgentTools"
        WHERE "AgentTools".tool_id = "Tools".id
        AND "AgentTools".agent_id IN (
            SELECT id FROM "Agents"
            WHERE (config->>'owner_id')::UUID = auth.uid()
        )
    ));

CREATE POLICY "AgentTools Owner Access" ON "AgentTools"
    USING (EXISTS (
        SELECT 1 FROM "Agents"
        WHERE "Agents".id = agent_id
        AND ("Agents".config->>'owner_id')::UUID = auth.uid()
    ));

CREATE POLICY "Executions Owner Access" ON "Executions"
    USING (EXISTS (
        SELECT 1 FROM "Agents"
        WHERE "Agents".id = agent_id
        AND ("Agents".config->>'owner_id')::UUID = auth.uid()
    ));

CREATE POLICY "VectorMemories Owner Access" ON "VectorMemories"
    USING (EXISTS (
        SELECT 1 FROM "Agents"
        WHERE "Agents".id = agent_id
        AND ("Agents".config->>'owner_id')::UUID = auth.uid()
    ));

COMMIT;