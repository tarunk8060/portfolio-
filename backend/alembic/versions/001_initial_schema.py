"""Initial schema: admin_users, projects, and skills tables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Admin Users Table
    op.create_table(
        'admin_users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False, server_default='Tarun K'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_admin_users_email', 'admin_users', ['email'], unique=True)

    # 2. Projects Table
    op.create_table(
        'projects',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('short_description', sa.String(length=500), nullable=False),
        sa.Column('full_description', sa.Text(), nullable=False),
        sa.Column('technologies', sa.JSON(), nullable=False),
        sa.Column('highlights', sa.JSON(), nullable=False),
        sa.Column('thumbnail_url', sa.String(length=1024), nullable=False),
        sa.Column('github_url', sa.String(length=1024), nullable=True),
        sa.Column('live_demo_url', sa.String(length=1024), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=False, server_default='fullstack'),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_projects_slug', 'projects', ['slug'], unique=True)
    op.create_index('idx_projects_status', 'projects', ['status'])
    op.create_index('idx_projects_display_order', 'projects', ['display_order'])
    op.create_index('idx_projects_category', 'projects', ['category'])
    op.create_index('idx_projects_is_featured', 'projects', ['is_featured'])

    # 3. Skills Table
    op.create_table(
        'skills',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('icon_url', sa.String(length=1024), nullable=True),
        sa.Column('badge_label', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='published'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_skills_category', 'skills', ['category'])
    op.create_index('idx_skills_status', 'skills', ['status'])
    op.create_index('idx_skills_display_order', 'skills', ['display_order'])

def downgrade() -> None:
    op.drop_table('skills')
    op.drop_table('projects')
    op.drop_table('admin_users')
