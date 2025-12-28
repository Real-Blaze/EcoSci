
import React, { useState, useMemo } from 'react';
import { PhenotypingViewer } from './PhenotypingViewer';
import { Camera, Upload, Users, Heart, MessageSquare, Share2, ScanFace, FileOutput, Plus, X, Send, Search, Sparkles } from 'lucide-react';
import { Attachment, Post, UserProfile } from '../types';

interface CommunityBenchProps {
    onSendMessage: (text: string, attachments: Attachment[]) => void;
    posts: Post[];
    setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
    userProfile: UserProfile;
}

export const CommunityBench: React.FC<CommunityBenchProps> = ({ onSendMessage, posts, setPosts, userProfile }) => {
    const [activeTab, setActiveTab] = useState<'feed' | 'tool'>('feed');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    
    // Posting State
    const [showPostModal, setShowPostModal] = useState(false);
    const [postTitle, setPostTitle] = useState("");
    const [postDesc, setPostDesc] = useState("");

    const filteredPosts = useMemo(() => {
        if (!searchQuery) return posts;
        const lower = searchQuery.toLowerCase();
        return posts.filter(p => 
            p.title.toLowerCase().includes(lower) || 
            p.user.toLowerCase().includes(lower) || 
            p.description.toLowerCase().includes(lower) ||
            p.tags?.some(t => t.toLowerCase().includes(lower))
        );
    }, [posts, searchQuery]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            setIsProcessing(true);
            reader.onload = (event) => {
                setTimeout(() => {
                    setSelectedImage(event.target?.result as string);
                    setIsProcessing(false);
                }, 1500); 
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLike = (id: number) => {
        setPosts(prev => prev.map(p => {
            if (p.id === id) {
                return { 
                    ...p, 
                    likes: p.isLiked ? p.likes - 1 : p.likes + 1,
                    isLiked: !p.isLiked
                };
            }
            return p;
        }));
    };

    const handlePublish = () => {
        if (!selectedImage || !postTitle) return;
        
        const newPost: Post = {
            id: Date.now(),
            userId: userProfile.name, // In real app use ID
            user: userProfile.name,
            avatar: userProfile.avatar,
            title: postTitle,
            description: postDesc || "Shared from 3D Phenotyper Lab.",
            image: selectedImage,
            likes: 0,
            comments: 0,
            timestamp: "Just now",
            isLiked: false,
            tags: ["New Discovery"]
        };

        setPosts(prev => [newPost, ...prev]);
        setShowPostModal(false);
        setActiveTab('feed');
        setPostTitle("");
        setPostDesc("");
    };

    const handleAiReview = () => {
        onSendMessage("Please review the recent posts on the Community Bench. Summarize the findings, identify common themes in morphology or species being discussed, and suggest a research direction based on this data.", []);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-20 sticky top-0">
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Users className="text-indigo-600" />
                        Community Bench
                    </h1>
                    <p className="text-sm text-gray-500 hidden md:block">Collaborative research & phenotyping tools</p>
                </div>
                
                <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner ml-4">
                    <button 
                        onClick={() => setActiveTab('feed')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'feed' ? 'bg-white text-gray-900 shadow-sm transform scale-105' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Feed
                    </button>
                    <button 
                        onClick={() => setActiveTab('tool')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'tool' ? 'bg-indigo-600 text-white shadow-sm transform scale-105' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <ScanFace size={16} />
                        Phenotyper
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
                <div className="max-w-3xl mx-auto">
                    
                    {activeTab === 'feed' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                             
                             {/* AI Review & Search Bar */}
                             <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Search species, users, or tags..." 
                                        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={handleAiReview}
                                    className="bg-indigo-100 text-indigo-700 px-4 py-3 rounded-xl font-bold text-sm hover:bg-indigo-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={16} />
                                    AI Review
                                </button>
                             </div>

                             {/* Create Post Widget */}
                             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4 cursor-pointer hover:border-indigo-300 transition-colors group" onClick={() => setActiveTab('tool')}>
                                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors overflow-hidden">
                                    {userProfile.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : <Plus size={24} />}
                                </div>
                                <div className="flex-1">
                                    <div className="text-gray-900 font-bold mb-0.5">Start a new analysis</div>
                                    <div className="text-gray-400 text-sm">Upload a specimen to the 3D Phenotyper...</div>
                                </div>
                                <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:text-indigo-600 transition-colors">
                                    <ScanFace size={24} />
                                </div>
                             </div>

                             {filteredPosts.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <p>No posts found matching "{searchQuery}"</p>
                                </div>
                             ) : (
                                filteredPosts.map(post => (
                                 <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                     <div className="p-4 flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                             <img src={post.avatar} alt={post.user} className="w-10 h-10 rounded-full bg-gray-100 border border-gray-100 object-cover" />
                                             <div>
                                                 <div className="font-bold text-gray-900 text-sm">{post.user}</div>
                                                 <div className="text-xs text-gray-500">{post.timestamp}</div>
                                             </div>
                                         </div>
                                         <button className="text-gray-400 hover:text-gray-900">•••</button>
                                     </div>
                                     
                                     <div className="px-5 mb-4">
                                         <h3 className="font-bold text-lg mb-1 leading-tight">{post.title}</h3>
                                         <p className="text-gray-600 text-sm leading-relaxed mb-2">{post.description}</p>
                                         {post.tags && (
                                             <div className="flex flex-wrap gap-2">
                                                 {post.tags.map(tag => (
                                                     <span key={tag} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">#{tag}</span>
                                                 ))}
                                             </div>
                                         )}
                                     </div>

                                     {/* Feed Image / Preview */}
                                     <div 
                                        className="w-full h-80 bg-gray-900 relative group cursor-pointer overflow-hidden"
                                        onClick={() => {
                                            setSelectedImage(post.image);
                                            setActiveTab('tool');
                                        }}
                                     >
                                         <img src={post.image} alt={post.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-60 transition-opacity" />
                                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 duration-200">
                                             <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-2xl hover:bg-white hover:text-gray-900 transition-colors">
                                                 <ScanFace size={18} /> Inspect 3D Model
                                             </button>
                                         </div>
                                     </div>

                                     <div className="p-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/30">
                                         <div className="flex gap-6">
                                             <button 
                                                onClick={() => handleLike(post.id)}
                                                className={`flex items-center gap-2 text-sm font-bold transition-colors ${post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                                             >
                                                 <Heart size={20} className={post.isLiked ? 'fill-current' : ''} /> 
                                                 {post.likes}
                                             </button>
                                             <button className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 text-sm font-bold transition-colors">
                                                 <MessageSquare size={20} /> 
                                                 {post.comments}
                                             </button>
                                         </div>
                                         <button className="text-gray-400 hover:text-gray-900 transition-colors">
                                             <Share2 size={20} />
                                         </button>
                                     </div>
                                 </div>
                                ))
                             )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Intro Card */}
                            {!selectedImage && (
                                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 md:p-12 text-white mb-8 relative overflow-hidden shadow-2xl text-center">
                                    <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
                                        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                            <ScanFace size={40} className="text-indigo-300" />
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Gaussian Phenotyper</h2>
                                        <p className="text-indigo-200 mb-8 leading-relaxed text-lg">
                                            Advanced Point Cloud Reconstruction. Upload any macro photo to analyze depth structure, surface area, and morphology in 3D.
                                        </p>
                                        
                                        <label className="inline-flex items-center gap-3 bg-white text-indigo-900 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-1 active:scale-95">
                                            <Upload size={22} />
                                            Select Specimen Photo
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                    <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                </div>
                            )}

                            {isProcessing && (
                                <div className="bg-white rounded-3xl p-16 text-center border border-gray-200 shadow-xl max-w-md mx-auto">
                                    <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-8"></div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Reconstructing Geometry</h3>
                                    <p className="text-gray-500">Generating voxel data from 2D input...</p>
                                </div>
                            )}

                            {selectedImage && !isProcessing && (
                                <div className="space-y-6">
                                    <PhenotypingViewer imageSrc={selectedImage} />
                                    
                                    {/* Action Bar */}
                                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                                                <ScanFace size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">Analysis Ready</h3>
                                                <p className="text-xs text-gray-500">Model generated successfully</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 w-full md:w-auto">
                                            <button className="flex-1 md:flex-none p-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors" onClick={() => setSelectedImage(null)}>
                                                Reset
                                            </button>
                                            <button 
                                                onClick={() => onSendMessage("I have generated a 3D model of this specimen. Please analyze its morphology based on the point cloud structure.", [])}
                                                className="flex-1 md:flex-none bg-indigo-50 text-indigo-700 px-5 py-3 rounded-xl font-bold text-sm hover:bg-indigo-100 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <FileOutput size={18} />
                                                Report
                                            </button>
                                            <button 
                                                onClick={() => setShowPostModal(true)}
                                                className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                                            >
                                                <Share2 size={18} />
                                                Share
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-900 text-white p-6 rounded-2xl relative overflow-hidden">
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Surface Area</div>
                                            <div className="text-2xl font-mono font-bold">~124.5 cm²</div>
                                            <div className="absolute top-0 right-0 p-4 opacity-10"><ScanFace size={40} /></div>
                                        </div>
                                        <div className="bg-white border border-gray-200 p-6 rounded-2xl">
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Est. Volume</div>
                                            <div className="text-2xl font-mono font-bold text-gray-900">~45.2 cm³</div>
                                        </div>
                                        <div className="bg-white border border-gray-200 p-6 rounded-2xl">
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Symmetry</div>
                                            <div className="text-2xl font-mono font-bold text-gray-900">Radial (5)</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Post Modal */}
            {showPostModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Share Findings</h3>
                            <button onClick={() => setShowPostModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                <img src={userProfile.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <div className="text-sm font-bold text-gray-900">{userProfile.name}</div>
                                    <div className="text-xs text-gray-500">{userProfile.specialization || "Researcher"}</div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Title</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                                    placeholder="e.g. Quercus Bark Analysis"
                                    value={postTitle}
                                    onChange={(e) => setPostTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Observation Notes</label>
                                <textarea 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                                    placeholder="Describe the morphological features..."
                                    value={postDesc}
                                    onChange={(e) => setPostDesc(e.target.value)}
                                />
                            </div>
                            
                            <button 
                                onClick={handlePublish}
                                disabled={!postTitle}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Send size={18} />
                                Publish to Community
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
