-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT, -- User email at the time of feedback
    type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'question', 'other')),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- Create index on status for admin queries
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON feedback
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Policy: Admins can update feedback
CREATE POLICY "Admins can update feedback"
ON feedback
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_feedback_updated_at
BEFORE UPDATE ON feedback
FOR EACH ROW
EXECUTE FUNCTION update_feedback_updated_at();

-- Add comment to table
COMMENT ON TABLE feedback IS 'User feedback and support requests';
COMMENT ON COLUMN feedback.type IS 'Type of feedback: bug, feature, improvement, question, other';
COMMENT ON COLUMN feedback.status IS 'Status: pending, in_progress, resolved, rejected';
