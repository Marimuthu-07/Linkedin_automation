import React, { useState, useEffect, useMemo } from 'react';
import {
  PenSquare,
  Plus,
  Sparkles,
  Calendar as CalendarIcon,
  List,
  Search,
  CheckCircle,
  Clock,
  BarChart2,
  Tag,
  Copy,
  Trash2,
  Edit3,
  ExternalLink,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Send,
  History,
  Check,
  Filter,
  RefreshCw,
  Eye,
  MessageSquare,
  Repeat,
  MousePointer,
  ThumbsUp,
  Sliders,
  Layers,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api.js';
import {
  ContentPost,
  ContentStatus,
  ContentCategory,
  ContentRevision,
  ContentMetric,
  ContentStats,
  VALID_CONTENT_TRANSITIONS,
  calculateEngagementRate,
} from '@linkedin-growth/shared';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { StatsCard } from '../components/common/StatsCard.js';
import { formatDate, formatRelativeTime } from '../lib/utils.js';

// Pre-defined technical templates
const CONTENT_TEMPLATES = [
  {
    id: 'tech_lesson',
    title: '1. Technical Lesson',
    category: ContentCategory.SOFTWARE_ENGINEERING,
    hook: 'Most engineers treat [Topic/Concept] as simple until [Failure/Edge Case] strikes in production. Here is what we learned:',
    body: `When handling [Scenario/Workload], the naive approach of [Common Pitfall] leads to [Problem Description].\n\nIn our recent project, we refactored the implementation:\n\n1. [Step 1: Measurement / Profiling]\n2. [Step 2: Core Architecture Shift]\n3. [Step 3: Edge Case Guardrail]\n\nThe result?\n- [Metric 1: e.g. 50% lower latency/memory]\n- [Metric 2: Zero crashes / cleaner code]\n\nThe key lesson: [Actionable Takeaway].`,
    cta: 'What is your go-to approach for managing [Topic] in production? Let’s discuss below!',
    hashtags: ['softwareengineering', 'architecture', 'backend', 'cleancode'],
  },
  {
    id: 'project_update',
    title: '2. Project Update / Build in Public',
    category: ContentCategory.PROJECT_BUILDING,
    hook: 'I spent the last 2 weeks building [Project Name] from scratch in [Tech Stack]. Here are 3 non-obvious engineering decisions:',
    body: `Building [Project Name] taught me a lot about [Core Domain]. Here is what went into the architecture:\n\n1. [Decision 1: Framework / DB choice and why]\n2. [Decision 2: State management / data flow]\n3. [Decision 3: Manual vs automated trade-off]\n\nBiggest challenge faced: [Challenge & Solution].\n\nNext milestone: [Upcoming Feature].`,
    cta: 'Have you built something similar with [Tech Stack]? Check out my open source repo and share your thoughts!',
    hashtags: ['buildinpublic', 'typescript', 'fullstack', 'opensource'],
  },
  {
    id: 'what_i_learned',
    title: '3. What I Learned',
    category: ContentCategory.LEARNING,
    hook: 'I used to think [Misconception/Old Belief]. After deep diving into [Topic], here is the reality:',
    body: `Here is the breakdown:\n\n1. The Theory: [Brief concept explanation]\n2. The Gotcha: [Where developers get confused]\n3. The Fix: [How to handle it properly in code]\n\nUnderstanding the lower-level mechanics makes modern high-level abstractions feel much simpler.`,
    cta: 'What concept took you the longest to truly wrap your head around?',
    hashtags: ['learning', 'computerscience', 'programming', 'softwareengineer'],
  },
  {
    id: 'technical_explanation',
    title: '4. Technical Explanation (Under the Hood)',
    category: ContentCategory.DATABASES,
    hook: 'What actually happens under the hood when you execute [Command / Query / API Call]?',
    body: `1. Step 1: [Parsing / Initialization]\n2. Step 2: [Execution / Engine internal traversal]\n3. Step 3: [I/O and persistence / Memory cleanup]\n\nRules of thumb:\n- [Tip 1]\n- [Tip 2]\n\nKnowing how your tools work under the hood is what separates code writers from systems engineers.`,
    cta: 'Which internal architecture topic should I break down next?',
    hashtags: ['databases', 'systemdesign', 'performance', 'softwareengineering'],
  },
  {
    id: 'mistake_to_lesson',
    title: '5. Mistake → Lesson',
    category: ContentCategory.ENGINEERING_INSIGHTS,
    hook: 'I made a costly architectural mistake with [Tech/Architecture] so you don’t have to:',
    body: `The Mistake:\n[Explain the initial implementation and why it failed].\n\nThe Symptom:\n[What happened: high latency, flaky tests, race conditions].\n\nThe Root Cause:\n[Underlying mechanism that was misunderstood].\n\nThe Solution:\n[How it was fixed with minimal overhead].\n\nLesson: [One sentence takeaway].`,
    cta: 'What is the most instructive bug or architectural mistake you’ve encountered recently?',
    hashtags: ['engineering', 'debugging', 'postmortem', 'softwaredevelopment'],
  },
  {
    id: 'tool_discovery',
    title: '6. Tool / Technology Discovery',
    category: ContentCategory.DEV_TOOLS,
    hook: '5 [Category, e.g. Linux / TypeScript / Docker] tools that instantly leveled up my developer workflow:',
    body: `1. [Tool 1]: [Specific high-impact use case]\n2. [Tool 2]: [Specific high-impact use case]\n3. [Tool 3]: [Specific high-impact use case]\n4. [Tool 4]: [Specific high-impact use case]\n5. [Tool 5]: [Specific high-impact use case]\n\nFluency with developer tooling shortens the feedback loop between idea and working software.`,
    cta: 'Which developer tool do you find yourself recommending to every engineer you meet?',
    hashtags: ['devtools', 'productivity', 'terminal', 'developer'],
  },
  {
    id: 'engineering_insight',
    title: '7. Engineering Insight / Trade-offs',
    category: ContentCategory.SOFTWARE_ENGINEERING,
    hook: 'There are no solutions in software architecture—only trade-offs. Here is how we evaluated [Choice A] vs [Choice B]:',
    body: `When architecting [System Component], we compared two primary approaches:\n\nOption A: [Approach A]\n- Pros: [Fast, simple]\n- Cons: [Scaling limit / coupling]\n\nOption B: [Approach B]\n- Pros: [High isolation, flexible]\n- Cons: [Operational complexity]\n\nOur decision: We chose [Option] because [Concrete reason].`,
    cta: 'How does your team evaluate this trade-off in production systems?',
    hashtags: ['systemdesign', 'architecture', 'softwareengineering', 'cleancode'],
  },
  {
    id: 'weekly_progress',
    title: '8. Weekly Progress / Student Retrospective',
    category: ContentCategory.CAREER,
    hook: 'Weekly Engineering Retrospective: 3 wins, 2 lessons, and 1 roadblock from this week:',
    body: `🚀 Wins:\n- [Shipped feature / capstone milestone]\n- [Solved tricky algorithm or bug]\n\n🧠 Lessons:\n- [Insight gained from code review or debugging]\n- [New library pattern mastered]\n\n🚧 Roadblock for next week:\n- [Challenge being tackled next]\n\nConsistent small steps compound rapidly over time.`,
    cta: 'What was your biggest technical win this past week?',
    hashtags: ['studentdeveloper', 'careers', 'growth', 'consistency'],
  },
];

export const ContentPage: React.FC = () => {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'upcoming'>('month');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isQuickIdeaModalOpen, setIsQuickIdeaModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [activePost, setActivePost] = useState<ContentPost | null>(null);

  // Quick Idea State
  const [quickIdea, setQuickIdea] = useState('');
  const [quickCategory, setQuickCategory] = useState<ContentCategory>(ContentCategory.SOFTWARE_ENGINEERING);

  // Full Editor State
  const [editorForm, setEditorForm] = useState({
    title: '',
    idea: '',
    hook: '',
    body: '',
    cta: '',
    category: ContentCategory.SOFTWARE_ENGINEERING,
    status: ContentStatus.IDEA,
    targetAudience: 'Software Engineers & Technical Leads',
    tone: 'AUTHENTIC_TECHNICAL',
    sourceContext: '',
    scheduledAt: '',
    externalPostUrl: '',
    hashtags: [] as string[],
    hashtagInput: '',
    notes: '',
  });

  // AI Workbench State (within Editor)
  const [aiActiveTab, setAiActiveTab] = useState<'ai' | 'revisions'>('ai');
  const [aiLength, setAiLength] = useState<'SHORT' | 'MEDIUM' | 'LONG'>('MEDIUM');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [isGeneratingCta, setIsGeneratingCta] = useState(false);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [generatedHooksList, setGeneratedHooksList] = useState<string[]>([]);
  const [generatedCtaList, setGeneratedCtaList] = useState<string[]>([]);
  const [generatedHashtagsList, setGeneratedHashtagsList] = useState<string[]>([]);

  // Revisions & Compare State
  const [revisionsList, setRevisionsList] = useState<ContentRevision[]>([]);
  const [compareData, setCompareData] = useState<{
    currentVersion: any;
    newVersion: any;
    warnings: string[];
    isLimitedContext: boolean;
  } | null>(null);

  // Manual Publish Workflow State
  const [publishUrl, setPublishUrl] = useState('');
  const [copiedPost, setCopiedPost] = useState(false);

  // Metrics State
  const [metricsPost, setMetricsPost] = useState<ContentPost | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<ContentMetric[]>([]);
  const [metricsForm, setMetricsForm] = useState({
    impressions: 0,
    reactions: 0,
    comments: 0,
    reposts: 0,
    clicks: 0,
    followersAtPublication: 0,
  });

  // User Timezone
  const userTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  }, []);

  const loadStats = () => {
    api.getContentStats()
      .then(setStats)
      .catch((err) => console.error('Failed to load content stats:', err));
  };

  const loadPosts = () => {
    setLoading(true);
    api.getContentPosts({
      status: selectedStatus,
      category: selectedCategory,
      search: searchQuery,
      page: currentPage,
      limit: 12,
    })
      .then((res) => {
        setPosts(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.total);
      })
      .catch((err) => console.error('Failed to load content posts:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [selectedStatus, selectedCategory, searchQuery, currentPage]);

  // Open Full Editor for Create
  const handleOpenCreate = (initialData?: Partial<typeof editorForm>) => {
    setActivePost(null);
    setEditorForm({
      title: initialData?.title || '',
      idea: initialData?.idea || '',
      hook: initialData?.hook || '',
      body: initialData?.body || '',
      cta: initialData?.cta || '',
      category: initialData?.category || ContentCategory.SOFTWARE_ENGINEERING,
      status: ContentStatus.IDEA,
      targetAudience: initialData?.targetAudience || 'Software Engineers & Technical Leads',
      tone: initialData?.tone || 'AUTHENTIC_TECHNICAL',
      sourceContext: initialData?.sourceContext || '',
      scheduledAt: '',
      externalPostUrl: '',
      hashtags: initialData?.hashtags || [],
      hashtagInput: '',
      notes: '',
    });
    setRevisionsList([]);
    setAiWarnings([]);
    setGeneratedHooksList([]);
    setGeneratedCtaList([]);
    setGeneratedHashtagsList([]);
    setIsEditorModalOpen(true);
  };

  // Open Full Editor for Existing Post
  const handleOpenEdit = async (post: ContentPost) => {
    setActivePost(post);
    setEditorForm({
      title: post.title,
      idea: post.idea || '',
      hook: post.hook || '',
      body: post.body || '',
      cta: post.cta || '',
      category: post.category,
      status: post.status,
      targetAudience: post.targetAudience || 'Software Engineers & Technical Leads',
      tone: post.tone || 'AUTHENTIC_TECHNICAL',
      sourceContext: post.sourceContext || '',
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
      externalPostUrl: post.externalPostUrl || '',
      hashtags: post.hashtags || post.tags || [],
      hashtagInput: '',
      notes: post.notes || '',
    });
    setAiWarnings([]);
    setGeneratedHooksList(post.alternativeHooks || []);
    setGeneratedCtaList([]);
    setGeneratedHashtagsList([]);

    // Load revisions
    try {
      const revs = await api.getContentRevisions(post.id);
      setRevisionsList(revs);
    } catch (e) {
      console.error('Failed to load revisions:', e);
    }

    setIsEditorModalOpen(true);
  };

  // Save Post from Editor
  const handleSaveEditor = async (targetStatus?: ContentStatus) => {
    try {
      const payload: any = {
        title: editorForm.title.trim() || (editorForm.idea ? editorForm.idea.slice(0, 80) : 'Untitled Post'),
        idea: editorForm.idea || null,
        hook: editorForm.hook,
        body: editorForm.body,
        cta: editorForm.cta || null,
        category: editorForm.category,
        targetAudience: editorForm.targetAudience,
        tone: editorForm.tone,
        sourceContext: editorForm.sourceContext || null,
        hashtags: editorForm.hashtags,
        tags: editorForm.hashtags,
        notes: editorForm.notes || null,
        scheduledAt: editorForm.scheduledAt ? new Date(editorForm.scheduledAt).toISOString() : null,
        externalPostUrl: editorForm.externalPostUrl || null,
      };

      if (targetStatus) {
        payload.status = targetStatus;
      }

      if (activePost) {
        await api.updateContentPost(activePost.id, payload);
      } else {
        await api.createContentPost({
          ...payload,
          status: targetStatus || ContentStatus.IDEA,
        });
      }

      setIsEditorModalOpen(false);
      loadPosts();
      loadStats();
    } catch (err: any) {
      alert(`Error saving post: ${err.message}`);
    }
  };

  // Quick Idea Submission
  const handleQuickIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickIdea.trim()) return;

    try {
      await api.createContentPost({
        title: quickIdea.trim().slice(0, 100),
        idea: quickIdea.trim(),
        category: quickCategory,
        status: ContentStatus.IDEA,
      });

      setQuickIdea('');
      setIsQuickIdeaModalOpen(false);
      loadPosts();
      loadStats();
    } catch (err: any) {
      alert(`Error creating idea: ${err.message}`);
    }
  };

  // Status Change directly from list or editor
  const handleStatusTransition = async (postId: string, newStatus: ContentStatus) => {
    try {
      await api.updateContentStatus(postId, newStatus);
      loadPosts();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Status transition failed');
    }
  };

  // Delete Post
  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post and its revision history?')) return;
    try {
      await api.deleteContentPost(id);
      loadPosts();
      loadStats();
    } catch (err: any) {
      alert(`Failed to delete post: ${err.message}`);
    }
  };

  // AI Draft Generation inside Editor
  const handleAiGenerateDraft = async () => {
    setIsGenerating(true);
    try {
      if (activePost) {
        const res = await api.generatePostDraft(activePost.id, { desiredLength: aiLength });
        setEditorForm((prev) => ({
          ...prev,
          title: res.post.title,
          hook: res.post.hook,
          body: res.post.body,
          cta: res.post.cta || prev.cta,
          hashtags: res.post.hashtags || prev.hashtags,
          status: res.post.status,
        }));
        setAiWarnings(res.warnings || []);
        if (res.generated?.alternativeHooks) {
          setGeneratedHooksList(res.generated.alternativeHooks);
        }
        // Refresh revisions
        const revs = await api.getContentRevisions(activePost.id);
        setRevisionsList(revs);
      } else {
        // Standalone generation
        const res = await api.generateStandaloneContent({
          idea: editorForm.idea || editorForm.title,
          topic: editorForm.title || editorForm.idea,
          category: editorForm.category,
          targetAudience: editorForm.targetAudience,
          tone: editorForm.tone,
          sourceContext: editorForm.sourceContext,
          desiredLength: aiLength,
        });

        setEditorForm((prev) => ({
          ...prev,
          title: res.title,
          hook: res.hook,
          body: res.body,
          cta: res.cta,
          hashtags: res.hashtags || res.suggestedHashtags,
        }));
        setAiWarnings(res.warnings || []);
        if (res.alternativeHooks) {
          setGeneratedHooksList(res.alternativeHooks);
        }
      }
    } catch (err: any) {
      alert(`AI Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Regenerate with side-by-side comparison
  const handleAiRegenerateCompare = async () => {
    if (!activePost) return;
    setIsGenerating(true);
    try {
      const res = await api.regeneratePostDraft(activePost.id, {
        desiredLength: aiLength,
        tone: editorForm.tone,
      });

      setCompareData(res);
      setIsCompareModalOpen(true);
    } catch (err: any) {
      alert(`Regeneration failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply Compared Version
  const handleApplyComparedVersion = async () => {
    if (!activePost || !compareData) return;
    try {
      const res = await api.regeneratePostDraft(activePost.id, {
        desiredLength: aiLength,
        tone: editorForm.tone,
        autoApply: true,
      });

      if (res.post) {
        setEditorForm((prev) => ({
          ...prev,
          title: res.post?.title || prev.title,
          hook: res.post?.hook || prev.hook,
          body: res.post?.body || prev.body,
          cta: res.post?.cta || '',
          hashtags: res.post?.hashtags || [],
        }));
      }


      setIsCompareModalOpen(false);
      setCompareData(null);
      const revs = await api.getContentRevisions(activePost.id);
      setRevisionsList(revs);
      loadPosts();
    } catch (err: any) {
      alert(`Failed to apply version: ${err.message}`);
    }
  };

  // Hook Generation
  const handleGenerateHooks = async () => {
    if (!activePost) return;
    setIsGeneratingHooks(true);
    try {
      const res = await api.generatePostHooks(activePost.id);
      setGeneratedHooksList(res.hooks);
    } catch (err: any) {
      alert(`Failed to generate hooks: ${err.message}`);
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  // CTA Generation
  const handleGenerateCta = async () => {
    if (!activePost) return;
    setIsGeneratingCta(true);
    try {
      const res = await api.generatePostCta(activePost.id);
      setGeneratedCtaList(res.ctas);
    } catch (err: any) {
      alert(`Failed to generate CTAs: ${err.message}`);
    } finally {
      setIsGeneratingCta(false);
    }
  };

  // Hashtag Generation
  const handleGenerateHashtags = async () => {
    if (!activePost) return;
    setIsGeneratingHashtags(true);
    try {
      const res = await api.generatePostHashtags(activePost.id);
      setGeneratedHashtagsList(res.hashtags);
    } catch (err: any) {
      alert(`Failed to generate hashtags: ${err.message}`);
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  // Open Publish Modal
  const handleOpenPublishModal = (post: ContentPost) => {
    setActivePost(post);
    setPublishUrl(post.externalPostUrl || '');
    setCopiedPost(false);
    setIsPublishModalOpen(true);
  };

  // Confirm Manual Publication
  const handleConfirmPublish = async () => {
    if (!activePost) return;
    try {
      await api.publishRecordPost(activePost.id, {
        publishedAt: new Date().toISOString(),
        externalPostUrl: publishUrl.trim() || undefined,
      });

      setIsPublishModalOpen(false);
      loadPosts();
      loadStats();
    } catch (err: any) {
      alert(`Failed to record publication: ${err.message}`);
    }
  };

  // Copy Post Text to Clipboard
  const handleCopyPostText = (post: ContentPost | typeof editorForm) => {
    const fullText = `${post.hook}\n\n${post.body}${post.cta ? `\n\n${post.cta}` : ''}${
      post.hashtags && post.hashtags.length > 0 ? `\n\n${post.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}` : ''
    }`;

    navigator.clipboard.writeText(fullText);
    setCopiedPost(true);
    setTimeout(() => setCopiedPost(false), 2500);
  };

  // Open Metrics Modal
  const handleOpenMetricsModal = async (post: ContentPost) => {
    setMetricsPost(post);
    const latest = Array.isArray(post.metrics) && post.metrics.length > 0 ? post.metrics[0] : (post.latestMetrics || null);

    setMetricsForm({
      impressions: latest?.impressions || 0,
      reactions: latest?.reactions || 0,
      comments: latest?.comments || 0,
      reposts: latest?.reposts || 0,
      clicks: latest?.clicks || 0,
      followersAtPublication: latest?.followersAtPublication || 0,
    });

    try {
      const res = await api.getContentMetrics(post.id);
      setMetricsHistory(res.snapshots);
    } catch (e) {
      console.error('Failed to load metric history:', e);
    }

    setIsMetricsModalOpen(true);
  };

  // Save Metrics Snapshot
  const handleSaveMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricsPost) return;

    try {
      await api.recordContentMetrics(metricsPost.id, metricsForm);
      setIsMetricsModalOpen(false);
      loadPosts();
      loadStats();
    } catch (err: any) {
      alert(`Error saving metrics: ${err.message}`);
    }
  };

  // Character counts and target indicators
  const bodyCharCount = editorForm.body.length;
  const hookCharCount = editorForm.hook.length;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-sky-400">
              Content Engine
            </h1>
            <Badge variant="outline" className="text-xs bg-slate-900/60 border-slate-700 text-slate-300">
              Human-In-The-Loop
            </Badge>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Capture engineering lessons, draft grounded posts, schedule reminders, and track authentic technical growth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsQuickIdeaModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            + Quick Idea
          </button>

          <button
            onClick={() => setIsTemplatesModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Templates
          </button>

          <button
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 text-center">
            <div className="text-xs font-medium text-slate-400">Total Posts</div>
            <div className="text-xl font-bold text-slate-100 mt-0.5">{stats.totalPosts}</div>
          </div>
          <div className="bg-slate-900/70 border border-blue-500/20 rounded-xl p-3 text-center">
            <div className="text-xs font-medium text-blue-400">Ideas</div>
            <div className="text-xl font-bold text-blue-200 mt-0.5">{stats.ideasCount}</div>
          </div>
          <div className="bg-slate-900/70 border border-amber-500/20 rounded-xl p-3 text-center">
            <div className="text-xs font-medium text-amber-400">Drafts</div>
            <div className="text-xl font-bold text-amber-200 mt-0.5">{stats.draftsCount}</div>
          </div>
          <div className="bg-slate-900/70 border border-yellow-500/20 rounded-xl p-3 text-center">
            <div className="text-xs font-medium text-yellow-400">In Review</div>
            <div className="text-xl font-bold text-yellow-200 mt-0.5">{stats.reviewCount}</div>
          </div>
          <div className="bg-slate-900/70 border border-emerald-500/20 rounded-xl p-3 text-center">
            <div className="text-xs font-medium text-emerald-400">Approved</div>
            <div className="text-xl font-bold text-emerald-200 mt-0.5">{stats.approvedCount}</div>
          </div>
          <div className="bg-slate-900/70 border border-purple-500/20 rounded-xl p-3 text-center">
            <div className="text-xs font-medium text-purple-400">Scheduled</div>
            <div className="text-xl font-bold text-purple-200 mt-0.5">{stats.scheduledCount}</div>
          </div>
          <div className="bg-slate-900/70 border border-green-500/20 rounded-xl p-3 text-center">
            <div className="text-xs font-medium text-green-400">Published</div>
            <div className="text-xl font-bold text-green-200 mt-0.5">{stats.publishedCount}</div>
          </div>
          <div className="bg-slate-900/70 border border-cyan-500/20 rounded-xl p-3 text-center">
            <div className="text-xs font-medium text-cyan-400">Avg Engagement</div>
            <div className="text-xl font-bold text-cyan-200 mt-0.5">
              {stats.avgEngagementRate !== null ? `${stats.avgEngagementRate}%` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Filter and View Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            {['ALL', 'IDEA', 'DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setSelectedStatus(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedStatus === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Posts' : st}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {Object.values(ContentCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Search & View Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search title, hook, body, tags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Calendar View"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
          Loading content engine...
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800/80">
              <PenSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium text-base">No content posts found</p>
              <p className="text-slate-500 text-sm mt-1">Start by capturing a quick idea or using a technical template.</p>
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => setIsQuickIdeaModalOpen(true)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30"
                >
                  + Capture Idea
                </button>
                <button
                  onClick={() => setIsTemplatesModalOpen(true)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Browse Templates
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => {
                const latestMetric = Array.isArray(post.metrics) && post.metrics.length > 0 ? post.metrics[0] : (post.latestMetrics || null);
                const allowedTransitions = VALID_CONTENT_TRANSITIONS[post.status] || [];

                return (
                  <div
                    key={post.id}
                    className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-indigo-500/5"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge status={post.status} className="text-xs uppercase tracking-wider font-semibold">
                          {post.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
                          {post.category.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => handleOpenEdit(post)}
                        className="text-base font-bold text-slate-100 hover:text-cyan-300 cursor-pointer line-clamp-2 transition-colors"
                      >
                        {post.title || post.idea || 'Untitled Post'}
                      </h3>

                      {/* Hook & Body Snippet */}
                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 font-mono">
                        {post.hook ? `"${post.hook}"` : post.idea || post.body || 'No hook drafted yet.'}
                      </p>

                      {/* Tags */}
                      {((post.hashtags && post.hashtags.length > 0) || (post.tags && post.tags.length > 0)) && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(post.hashtags || post.tags || []).slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[10px] text-cyan-400/80 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                              #{tag.replace(/^#/, '')}
                            </span>
                          ))}
                          {(post.hashtags || post.tags || []).length > 3 && (
                            <span className="text-[10px] text-slate-500">+{(post.hashtags || post.tags || []).length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Schedule / Published info */}
                      {post.status === ContentStatus.SCHEDULED && post.scheduledAt && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-300 bg-purple-950/40 p-2 rounded-lg border border-purple-800/40 font-medium">
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                          <span>Scheduled: {formatDate(post.scheduledAt)}</span>
                        </div>
                      )}

                      {post.status === ContentStatus.PUBLISHED && post.publishedAt && (
                        <div className="mt-3 flex items-center justify-between text-xs text-green-300 bg-green-950/30 p-2 rounded-lg border border-green-800/40">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            Published: {formatDate(post.publishedAt)}
                          </span>
                          {latestMetric && latestMetric.engagementRate !== null && (
                            <span className="font-semibold text-cyan-300">
                              {latestMetric.engagementRate}% ER
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="border-t border-slate-800/80 pt-3 mt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(post)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1"
                          title="Edit Post"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => handleCopyPostText(post)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                          title="Copy Post Text"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {post.status === ContentStatus.PUBLISHED && (
                          <button
                            onClick={() => handleOpenMetricsModal(post)}
                            className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-950/60 text-xs flex items-center gap-1"
                            title="Log Metrics"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* State Transition Actions */}
                      <div className="flex items-center gap-1.5">
                        {post.status === ContentStatus.IDEA && (
                          <button
                            onClick={() => handleStatusTransition(post.id, ContentStatus.DRAFT)}
                            className="px-2.5 py-1 text-xs font-semibold bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded border border-amber-500/40"
                          >
                            Draft
                          </button>
                        )}

                        {post.status === ContentStatus.DRAFT && (
                          <button
                            onClick={() => handleStatusTransition(post.id, ContentStatus.REVIEW)}
                            className="px-2.5 py-1 text-xs font-semibold bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 rounded border border-yellow-500/40"
                          >
                            Review
                          </button>
                        )}

                        {post.status === ContentStatus.REVIEW && (
                          <button
                            onClick={() => handleStatusTransition(post.id, ContentStatus.APPROVED)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded border border-emerald-500/40"
                          >
                            Approve
                          </button>
                        )}

                        {post.status === ContentStatus.APPROVED && (
                          <button
                            onClick={() => handleStatusTransition(post.id, ContentStatus.SCHEDULED)}
                            className="px-2.5 py-1 text-xs font-semibold bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded border border-purple-500/40"
                          >
                            Schedule
                          </button>
                        )}

                        {post.status === ContentStatus.SCHEDULED && (
                          <button
                            onClick={() => handleOpenPublishModal(post)}
                            className="px-2.5 py-1 text-xs font-semibold bg-green-600/30 hover:bg-green-600/50 text-green-300 rounded border border-green-500/40 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Publish
                          </button>
                        )}

                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-6">
              <div className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * 12 + 1}</span> to{' '}
                <span className="font-semibold text-slate-200">{Math.min(currentPage * 12, totalCount)}</span> of{' '}
                <span className="font-semibold text-slate-200">{totalCount}</span> posts
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CALENDAR VIEW */
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-slate-100">Content Schedule Calendar</h2>
              </div>
              <div className="text-xs text-purple-300 bg-purple-950/40 px-3 py-1.5 rounded-lg border border-purple-800/40">
                SCHEDULED — MANUAL PUBLISH REQUIRED (User publishes manually on LinkedIn)
              </div>
            </div>

            {/* Upcoming Scheduled Posts list */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled Posts & Reminders</h3>
              {posts.filter((p) => p.status === ContentStatus.SCHEDULED || p.scheduledAt).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No posts scheduled yet. Approve a draft and assign a date to schedule it.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {posts
                    .filter((p) => p.status === ContentStatus.SCHEDULED || p.scheduledAt)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {p.scheduledAt ? formatDate(p.scheduledAt) : 'Date Pending'}
                            </span>
                            <Badge status={p.status} className="text-[10px]">
                              {p.status}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{p.title}</h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.hook || p.body}</p>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            Reschedule / Edit
                          </button>
                          <button
                            onClick={() => handleOpenPublishModal(p)}
                            className="px-3 py-1 rounded text-xs font-semibold bg-green-600/30 text-green-300 hover:bg-green-600/50 border border-green-500/40"
                          >
                            Open & Publish
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK IDEA MODAL */}
      <Modal
        isOpen={isQuickIdeaModalOpen}
        onClose={() => setIsQuickIdeaModalOpen(false)}
        title="Capture Content Idea"
      >
        <form onSubmit={handleQuickIdeaSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              What did you learn or build today? <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={quickIdea}
              onChange={(e) => setQuickIdea(e.target.value)}
              placeholder="e.g., I learned how Docker volume mounts actually bind host directories with low-overhead in Linux."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value as ContentCategory)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {Object.values(ContentCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsQuickIdeaModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-600 hover:to-cyan-600 shadow-md"
            >
              Save as Idea
            </button>
          </div>
        </form>
      </Modal>

      {/* TEMPLATES MODAL */}
      <Modal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        title="Technical Content Templates"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs text-slate-400">
            Select a proven engineering post framework. Templates provide structured thinking scaffolding without generic AI fluff.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {CONTENT_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => {
                  setIsTemplatesModalOpen(false);
                  handleOpenCreate({
                    title: tmpl.title.replace(/^\d+\.\s*/, ''),
                    hook: tmpl.hook,
                    body: tmpl.body,
                    cta: tmpl.cta,
                    category: tmpl.category,
                    hashtags: tmpl.hashtags,
                  });
                }}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-900/80 group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {tmpl.title}
                  </h4>
                  <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                    {tmpl.category.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 font-mono bg-slate-900/60 p-2 rounded">
                  {tmpl.hook}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* FULL CONTENT WORKSPACE / EDITOR MODAL */}
      <Modal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        title={activePost ? `Content Workspace: ${editorForm.title || 'Untitled'}` : 'Create New Content'}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto pr-1">
          {/* LEFT: Main Editor Form (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Post Title / Main Topic <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={editorForm.title}
                onChange={(e) => setEditorForm({ ...editorForm, title: e.target.value })}
                placeholder="e.g. How I reduced Node.js memory footprint by 60% with streaming buffers"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={editorForm.category}
                  onChange={(e) => setEditorForm({ ...editorForm, category: e.target.value as ContentCategory })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {Object.values(ContentCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Audience</label>
                <input
                  type="text"
                  value={editorForm.targetAudience}
                  onChange={(e) => setEditorForm({ ...editorForm, targetAudience: e.target.value })}
                  placeholder="e.g. Backend Engineers & Tech Leads"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Hook Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Opening Hook <span className="text-slate-500 font-normal">(first 2-3 lines visible in feed)</span>
                </label>
                <span className="text-[10px] text-slate-500">{hookCharCount} chars</span>
              </div>
              <textarea
                rows={2}
                value={editorForm.hook}
                onChange={(e) => setEditorForm({ ...editorForm, hook: e.target.value })}
                placeholder="Hook the reader with a practical problem, counter-intuitive insight, or compelling lesson..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Body Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Post Body</label>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className={bodyCharCount > 2500 ? 'text-rose-400' : 'text-slate-400'}>
                    {bodyCharCount} chars
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-500">
                    {bodyCharCount < 600 ? 'Short' : bodyCharCount <= 1500 ? 'Medium' : 'Long'}
                  </span>
                </div>
              </div>
              <textarea
                rows={8}
                value={editorForm.body}
                onChange={(e) => setEditorForm({ ...editorForm, body: e.target.value })}
                placeholder="Structure your points with clear line breaks, bullet points, and concrete results..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
              />
            </div>

            {/* CTA & Hashtags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Call to Action (CTA)</label>
                <input
                  type="text"
                  value={editorForm.cta}
                  onChange={(e) => setEditorForm({ ...editorForm, cta: e.target.value })}
                  placeholder="e.g. What is your go-to profiling tool?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  value={editorForm.scheduledAt}
                  onChange={(e) => setEditorForm({ ...editorForm, scheduledAt: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Local TZ: {userTimezone} (Manual Publish Required)
                </span>
              </div>
            </div>

            {/* Hashtags Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hashtags</label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-lg">
                {editorForm.hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40"
                  >
                    #{tag.replace(/^#/, '')}
                    <button
                      type="button"
                      onClick={() =>
                        setEditorForm({
                          ...editorForm,
                          hashtags: editorForm.hashtags.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-slate-400 hover:text-rose-300"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add hashtag + Enter..."
                  value={editorForm.hashtagInput}
                  onChange={(e) => setEditorForm({ ...editorForm, hashtagInput: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editorForm.hashtagInput.trim()) {
                      e.preventDefault();
                      const clean = editorForm.hashtagInput.trim().replace(/^#/, '');
                      if (!editorForm.hashtags.includes(clean)) {
                        setEditorForm({
                          ...editorForm,
                          hashtags: [...editorForm.hashtags, clean],
                          hashtagInput: '',
                        });
                      }
                    }
                  }}
                  className="bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none min-w-[120px]"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: AI Workbench & Revisions (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div>
              {/* Tab Selector */}
              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 mb-4">
                <button
                  type="button"
                  onClick={() => setAiActiveTab('ai')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all ${
                    aiActiveTab === 'ai' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Workbench
                </button>
                <button
                  type="button"
                  onClick={() => setAiActiveTab('revisions')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all ${
                    aiActiveTab === 'revisions' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  Revisions ({revisionsList.length})
                </button>
              </div>

              {aiActiveTab === 'ai' ? (
                /* AI WORKBENCH TAB */
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Raw Idea / Source Context
                    </label>
                    <textarea
                      rows={3}
                      value={editorForm.sourceContext || editorForm.idea}
                      onChange={(e) =>
                        setEditorForm({
                          ...editorForm,
                          sourceContext: e.target.value,
                          idea: e.target.value,
                        })
                      }
                      placeholder="Paste benchmark numbers, bug postmortems, capstone notes, or concepts..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Length and Generate Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      {(['SHORT', 'MEDIUM', 'LONG'] as const).map((len) => (
                        <button
                          key={len}
                          type="button"
                          onClick={() => setAiLength(len)}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                            aiLength === len ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAiGenerateDraft}
                      disabled={isGenerating}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white disabled:opacity-50 flex items-center gap-1.5 shadow"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isGenerating ? 'Generating...' : 'Generate Draft'}
                    </button>
                  </div>

                  {activePost && (
                    <button
                      type="button"
                      onClick={handleAiRegenerateCompare}
                      disabled={isGenerating}
                      className="w-full py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerate with Diff Compare
                    </button>
                  )}

                  {/* Warnings Banner */}
                  {aiWarnings.length > 0 && (
                    <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-2.5 text-xs text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        {aiWarnings.map((w, idx) => (
                          <div key={idx}>{w}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hook Suggestions */}
                  <div className="border-t border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-300">Hook Suggestions</span>
                      {activePost && (
                        <button
                          type="button"
                          onClick={handleGenerateHooks}
                          disabled={isGeneratingHooks}
                          className="text-[10px] text-cyan-400 hover:underline"
                        >
                          {isGeneratingHooks ? 'Generating...' : '+ Generate 5 Hooks'}
                        </button>
                      )}
                    </div>
                    {generatedHooksList.length > 0 ? (
                      <div className="space-y-1.5">
                        {generatedHooksList.map((h, idx) => (
                          <div
                            key={idx}
                            onClick={() => setEditorForm({ ...editorForm, hook: h })}
                            className="p-2 rounded bg-slate-900 hover:bg-indigo-950/60 border border-slate-800/80 hover:border-indigo-500/40 text-[11px] text-slate-300 cursor-pointer transition-all"
                            title="Click to apply hook"
                          >
                            {h}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-600">Click generate to produce grounded hook variations.</div>
                    )}
                  </div>

                  {/* CTA & Hashtag Suggestions */}
                  {activePost && (
                    <div className="border-t border-slate-800/80 pt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateCta}
                        disabled={isGeneratingCta}
                        className="flex-1 py-1 rounded text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      >
                        {isGeneratingCta ? 'Generating...' : '+ Suggest CTAs'}
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateHashtags}
                        disabled={isGeneratingHashtags}
                        className="flex-1 py-1 rounded text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      >
                        {isGeneratingHashtags ? 'Generating...' : '+ Suggest Tags'}
                      </button>
                    </div>
                  )}

                  {generatedCtaList.length > 0 && (
                    <div className="space-y-1 bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Suggested CTAs</span>
                      {generatedCtaList.map((cta, i) => (
                        <div
                          key={i}
                          onClick={() => setEditorForm({ ...editorForm, cta })}
                          className="text-[11px] text-slate-300 hover:text-cyan-300 cursor-pointer py-0.5"
                        >
                          &bull; {cta}
                        </div>
                      ))}
                    </div>
                  )}

                  {generatedHashtagsList.length > 0 && (
                    <div className="space-y-1 bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Suggested Tags</span>
                      <div className="flex flex-wrap gap-1">
                        {generatedHashtagsList.map((tag, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              const clean = tag.replace(/^#/, '');
                              if (!editorForm.hashtags.includes(clean)) {
                                setEditorForm({
                                  ...editorForm,
                                  hashtags: [...editorForm.hashtags, clean],
                                });
                              }
                            }}
                            className="text-[10px] text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40"
                          >
                            +{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* REVISIONS TAB */
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-300">Revision History</span>
                  {revisionsList.length === 0 ? (
                    <div className="text-xs text-slate-500 py-6 text-center">No previous revisions recorded.</div>
                  ) : (
                    <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                      {revisionsList.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-200">Revision #{rev.revisionNumber}</span>
                            <Badge variant="outline" className="text-[10px] text-slate-400">
                              {rev.createdBy}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono line-clamp-2">{rev.hook || rev.body}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                            <span className="text-[10px] text-slate-500">{formatRelativeTime(rev.createdAt)}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditorForm((prev) => ({
                                  ...prev,
                                  title: rev.title,
                                  hook: rev.hook,
                                  body: rev.body,
                                  cta: rev.cta || '',
                                  hashtags: rev.hashtags || [],
                                }));
                              }}
                              className="text-[10px] text-cyan-400 hover:underline"
                            >
                              Restore
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions inside Editor */}
            <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Discard
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveEditor()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  Save Draft
                </button>

                {editorForm.status === ContentStatus.DRAFT && (
                  <button
                    type="button"
                    onClick={() => handleSaveEditor(ContentStatus.REVIEW)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-yellow-600 hover:bg-yellow-500 text-white shadow"
                  >
                    Submit for Review
                  </button>
                )}

                {editorForm.status === ContentStatus.REVIEW && (
                  <button
                    type="button"
                    onClick={() => handleSaveEditor(ContentStatus.APPROVED)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                  >
                    Approve Post
                  </button>
                )}

                {editorForm.status === ContentStatus.APPROVED && (
                  <button
                    type="button"
                    onClick={() => handleSaveEditor(ContentStatus.SCHEDULED)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow"
                  >
                    Schedule Post
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* SIDE-BY-SIDE REVISION COMPARISON MODAL */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Compare AI Draft Variation"
      >
        {compareData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Version */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Current Version</span>
                  <Badge variant="outline" className="text-[10px]">Active</Badge>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-2">{compareData.currentVersion.title}</h4>
                <div className="text-xs text-slate-400 font-mono bg-slate-900/60 p-2.5 rounded-lg space-y-2 max-h-[300px] overflow-y-auto">
                  <p className="text-slate-300 font-semibold">{compareData.currentVersion.hook}</p>
                  <p className="whitespace-pre-line">{compareData.currentVersion.body}</p>
                  {compareData.currentVersion.cta && (
                    <p className="text-slate-400 italic">CTA: {compareData.currentVersion.cta}</p>
                  )}
                </div>
              </div>

              {/* New Version */}
              <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/40 shadow-lg shadow-cyan-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase">New AI Variation</span>
                  <Badge variant="outline" className="text-[10px] text-cyan-300 border-cyan-700">Proposed</Badge>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-2">{compareData.newVersion.title}</h4>
                <div className="text-xs text-slate-400 font-mono bg-slate-900/60 p-2.5 rounded-lg space-y-2 max-h-[300px] overflow-y-auto">
                  <p className="text-cyan-200 font-semibold">{compareData.newVersion.hook}</p>
                  <p className="whitespace-pre-line">{compareData.newVersion.body}</p>
                  {compareData.newVersion.cta && (
                    <p className="text-cyan-300/80 italic">CTA: {compareData.newVersion.cta}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Keep Current
              </button>
              <button
                type="button"
                onClick={handleApplyComparedVersion}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow"
              >
                Apply New Variation
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MANUAL PUBLISHING WORKFLOW MODAL */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Manual LinkedIn Publishing"
      >
        {activePost && (
          <div className="space-y-4">
            <div className="bg-purple-950/40 border border-purple-800/60 rounded-xl p-3 text-xs text-purple-200 flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" />
                SCHEDULED — MANUAL PUBLISH REQUIRED
              </span>
              <span className="text-purple-300">
                {activePost.scheduledAt ? formatDate(activePost.scheduledAt) : 'Ready'}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Compiled LinkedIn Post Content</label>
                <button
                  type="button"
                  onClick={() => handleCopyPostText(activePost)}
                  className="text-xs font-medium text-cyan-400 hover:underline flex items-center gap-1"
                >
                  {copiedPost ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPost ? 'Copied to clipboard!' : 'Copy full text'}
                </button>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono whitespace-pre-line max-h-[220px] overflow-y-auto leading-relaxed">
                {`${activePost.hook}\n\n${activePost.body}${activePost.cta ? `\n\n${activePost.cta}` : ''}${
                  activePost.hashtags && activePost.hashtags.length > 0
                    ? `\n\n${activePost.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}`
                    : ''
                }`}
              </div>
            </div>

            {/* Step 1: Open LinkedIn */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-200">Step 1: Paste on LinkedIn</span>
                <p className="text-[11px] text-slate-400">Open official LinkedIn feed in browser and paste the copied text.</p>
              </div>
              <a
                href="https://www.linkedin.com/feed/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open LinkedIn
              </a>
            </div>

            {/* Step 2: Record External URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Step 2 (Optional): Paste Published LinkedIn Post URL
              </label>
              <input
                type="url"
                value={publishUrl}
                onChange={(e) => setPublishUrl(e.target.value)}
                placeholder="https://www.linkedin.com/posts/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Published
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* METRICS RECORDING MODAL */}
      <Modal
        isOpen={isMetricsModalOpen}
        onClose={() => setIsMetricsModalOpen(false)}
        title={metricsPost ? `Log Metrics: ${metricsPost.title}` : 'Log Post Metrics'}
      >
        <form onSubmit={handleSaveMetrics} className="space-y-4">
          <p className="text-xs text-slate-400">
            Record snapshot metrics directly from your published LinkedIn post statistics. Engagement rate is calculated automatically.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Impressions</label>
              <input
                type="number"
                min="0"
                value={metricsForm.impressions}
                onChange={(e) => setMetricsForm({ ...metricsForm, impressions: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Reactions</label>
              <input
                type="number"
                min="0"
                value={metricsForm.reactions}
                onChange={(e) => setMetricsForm({ ...metricsForm, reactions: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Comments</label>
              <input
                type="number"
                min="0"
                value={metricsForm.comments}
                onChange={(e) => setMetricsForm({ ...metricsForm, comments: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Reposts</label>
              <input
                type="number"
                min="0"
                value={metricsForm.reposts}
                onChange={(e) => setMetricsForm({ ...metricsForm, reposts: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Clicks</label>
              <input
                type="number"
                min="0"
                value={metricsForm.clicks}
                onChange={(e) => setMetricsForm({ ...metricsForm, clicks: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="bg-slate-950 border border-cyan-500/30 p-2.5 rounded-lg text-center flex flex-col justify-center">
              <span className="text-[10px] font-medium text-cyan-400 uppercase">Calculated ER</span>
              <span className="text-base font-bold text-cyan-200">
                {calculateEngagementRate(
                  metricsForm.impressions,
                  metricsForm.reactions,
                  metricsForm.comments,
                  metricsForm.reposts,
                  metricsForm.clicks
                ) !== null
                  ? `${calculateEngagementRate(
                      metricsForm.impressions,
                      metricsForm.reactions,
                      metricsForm.comments,
                      metricsForm.reposts,
                      metricsForm.clicks
                    )}%`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Historical Snapshots */}
          {metricsHistory.length > 0 && (
            <div className="border-t border-slate-800 pt-3">
              <span className="text-xs font-semibold text-slate-300 mb-2 block">Previous Metric Logs</span>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {metricsHistory.map((s) => (
                  <div
                    key={s.id}
                    className="bg-slate-950 p-2 rounded border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-400">{formatDate(s.recordedAt)}</span>
                    <span className="text-slate-300">{s.impressions} imps</span>
                    <span className="text-cyan-300 font-semibold">{s.engagementRate !== null ? `${s.engagementRate}% ER` : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsMetricsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow"
            >
              Save Metric Snapshot
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
