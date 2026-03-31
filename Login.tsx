import React, { useEffect, useState } from 'react';
import { Sprout, BrainCircuit, BarChart3, Zap, ShieldCheck, Cpu, Leaf, Wind, Activity, ArrowRight, Cloud } from 'lucide-react';

type LoginPageProps = {
    onSignIn: () => void;
};

const FeatureCard = ({ icon: Icon, title, desc }: any) => (
    <div className={`bg-white/40 dark:bg-slate-800/50 backdrop-blur-lg border border-gray-100 dark:border-slate-700/50 p-6 rounded-3xl hover:-translate-y-2 transition-transform duration-500 shadow-xl shadow-emerald-900/5 group`}>
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
            <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">{desc}</p>
    </div>
);

const LoginPage: React.FC<LoginPageProps> = ({ onSignIn }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 transition-colors font-sans selection:bg-emerald-500/30">
            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 py-4 shadow-sm' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-emerald-400 to-teal-600 p-2 rounded-xl shadow-lg">
                            <Sprout className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">PolyGuard</span>
                    </div>
                    <button onClick={onSignIn} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 rounded-full font-bold text-sm tracking-wide hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gray-900/20 dark:shadow-white/10">
                        Launch Dashboard
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Abstract Background Orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs uppercase tracking-widest mb-6 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                PolyGuard v2.0 Live
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-6">
                                The Future of <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Smart Farming.</span>
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-xl leading-relaxed">
                                Experience an autonomous, AI-driven greenhouse ecosystem. Monitor climate, command dual-node hardware, and interact with your personal Agronomist Assistant.
                            </p>
                            
                            {/* Login Card inside Hero */}
                            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-2 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-2xl max-w-md ring-1 ring-black/5 dark:ring-white/5">
                                <button
                                    onClick={onSignIn}
                                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white rounded-full p-1 shadow-inner">
                                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                        </div>
                                        <span className="font-bold text-lg">Continue with Google</span>
                                    </div>
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform opacity-50 group-hover:opacity-100" />
                                </button>
                            </div>
                        </div>

                        {/* Visual Mockup Right Side */}
                        <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-12 duration-1000 mt-10">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-[2.5rem] transform rotate-3 scale-105 blur-2xl"></div>
                            <div className="relative bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 rounded-[2.5rem] shadow-2xl p-6 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                                {/* Mock UI Header */}
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-slate-700/50">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#fca5a5]"></div>
                                        <div className="w-3 h-3 rounded-full bg-[#fcd34d]"></div>
                                        <div className="w-3 h-3 rounded-full bg-[#86efac]"></div>
                                    </div>
                                    <div className="text-xs font-mono font-bold tracking-wider text-gray-400 bg-gray-100 dark:bg-slate-900 px-3 py-1 rounded-full">dashboard.polyguard.app</div>
                                </div>
                                {/* Mock UI Body */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 dark:bg-slate-900 rounded-2xl p-5 border border-blue-100 dark:border-slate-800">
                                        <Wind className="text-blue-500 mb-3" size={24}/>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Humidity</div>
                                        <div className="text-3xl font-extrabold text-blue-900 dark:text-blue-400">45<span className="text-lg opacity-50">%</span></div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-slate-900 rounded-2xl p-5 border border-emerald-100 dark:border-slate-800">
                                        <Activity className="text-emerald-500 mb-3" size={24}/>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">System</div>
                                        <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-400 mt-1">Online</div>
                                    </div>
                                    <div className="col-span-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white mt-2 shadow-inner">
                                        <BrainCircuit className="mb-3 opacity-90" size={28}/>
                                        <div className="font-bold text-xl mb-1 tracking-tight">AI Agronomist Active</div>
                                        <div className="text-sm font-medium opacity-90">Deterministic engine parsing local NLP commands...</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 bg-white dark:bg-slate-900/50 relative border-t border-gray-100 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 mb-6">
                            <Zap size={24} />
                        </div>
                        <h2 className="text-3xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">Command your ecosystem.</h2>
                        <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">PolyGuard seamlessly merges high-end hardware with localized AI to bring you unprecedented control over your polyhouse.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={Cpu} 
                            title="Dual-Node Hardware" 
                            desc="An unbreakable UART connection between the Master NodeMCU and Worker ESP32 ensures reliable automation without internet."
                        />
                        <FeatureCard 
                            icon={BrainCircuit} 
                            title="Local AI Agronomist" 
                            desc="Chat directly with your polyhouse. Our deterministic NLP engine parses intents to control actuators and analyze sensor trends."
                        />
                        <FeatureCard 
                            icon={BarChart3} 
                            title="Live Analytics" 
                            desc="Visualize robust real-time environmental data with granular D3/Recharts tracking temperature, humidity, and soil chemistry."
                        />
                        <FeatureCard 
                            icon={ShieldCheck} 
                            title="Secure Provisioning" 
                            desc="Lock down your hardware with our physical OTP pairing protocol. Bind devices to your cloud account instantly via OLED display."
                        />
                        <FeatureCard 
                            icon={Cloud} 
                            title="Firebase Sync" 
                            desc="Whether you are on the local network or halfway across the globe, the Firebase Realtime Database bridges the gap invisibly."
                        />
                        <FeatureCard 
                            icon={Activity} 
                            title="Fail-Safe Overrides" 
                            desc="5-minute manual override watchdogs and physical ultrasonic distance limiters prevent motor burnout and thermal runaway."
                        />
                    </div>
                </div>
            </div>

            {/* Support & CTA Section */}
            <div className="border-t border-gray-100 dark:border-slate-800/50 bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-950 py-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    
                    <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
                        <div className="p-10 bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-gray-100 dark:border-slate-700/50 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Need Expert Assistance?</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                                Our dedicated PolyGuard agronomy and technical support team is available 24/7. Connect with us directly on WhatsApp to troubleshoot hardware, refine AI models, or get deployment guidance. Your crop's success is our absolute priority.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a 
                                    href="https://wa.me/918328455203?text=Hello%20Team%20A9%2C%20I%20am%20interested%20in%20learning%20more%20about%20the%20PolyGuard%20Smart%20IoT%20System.%20Could%20you%20please%20provide%20me%20with%20more%20details%20regarding%20its%20features%20and%20hardware%20deployment%3F" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1DA851] text-white px-6 py-3.5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#25D366]/30 flex-1 justify-center whitespace-nowrap"
                                >
                                    <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.472-1.761-1.645-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                                    </svg>
                                    <span>WhatsApp</span>
                                </a>
                                
                                <a 
                                    href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=umesh4ex@gmail.com&su=Inquiry%3A%20PolyGuard%20Smart%20IoT%20System%20Details&body=Hello%20Team%20A9%2C%0D%0A%0D%0AI%20am%20interested%20in%20learning%20more%20about%20the%20PolyGuard%20Smart%20Ecosystem.%20Could%20you%20please%20provide%20me%20with%20additional%20details%20regarding%20the%20features%2C%20hardware%20components%2C%20and%20how%20to%20get%20started%3F%0D%0A%0D%0AThank%20you%2C%0D%0A%5BYour%20Name%5D" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30 flex-1 justify-center whitespace-nowrap"
                                >
                                    <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                    </svg>
                                    <span>Email Queries</span>
                                </a>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center text-center px-4">
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm">
                                <Leaf className="text-emerald-500" size={36} />
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">Ready to optimize?</h2>
                            
                            <button
                                onClick={onSignIn}
                                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30 mb-6 text-lg"
                            >
                                Sign in to Dashboard
                                <ArrowRight size={20} />
                            </button>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Join the revolution of modern polyhouse management.</p>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-gray-200 dark:border-slate-800/50 max-w-2xl mx-auto flex flex-col items-center gap-2 text-center">
                        <p className="font-bold text-gray-500 dark:text-gray-400">Powered by Team A9</p>
                        <p className="text-sm text-gray-400 dark:text-gray-600 font-medium">© 2026 PolyGuard IoT Core. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
