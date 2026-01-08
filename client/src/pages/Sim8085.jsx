import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaStepForward, FaStop, FaUndo, FaMicrochip, FaMemory, FaCog, FaClock, FaPlus, FaTimes } from 'react-icons/fa';
import { Sim8085Engine } from '../utils/SimEngine';

const Sim8085 = () => {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    // Engine Instance Ref (Persist across renders)
    const engineRef = useRef(new Sim8085Engine());
    const intervalRef = useRef(null);

    // UI State synced with Engine
    const [registers, setRegisters] = useState(engineRef.current.registers);
    const [flags, setFlags] = useState(engineRef.current.flags);
    const [tStates, setTStates] = useState(0);
    const [statusMsg, setStatusMsg] = useState('Ready');
    // Force re-render of memory when engine updates
    const [memRev, setMemRev] = useState(0);

    // Memory View "Columns"
    // Default to empty or just 8000 start
    const [memoryBlocks, setMemoryBlocks] = useState([
        { start: 0x8000, length: 256 }
    ]);
    const [newMemAddr, setNewMemAddr] = useState('');

    // Editing State
    const [editingCell, setEditingCell] = useState(null); // { addr: number, val: string }
    const [editValue, setEditValue] = useState('');

    // Code Editor
    const [code, setCode] = useState('');

    // Helper to sync UI from Engine
    const syncState = () => {
        setRegisters({ ...engineRef.current.registers });
        setFlags({ ...engineRef.current.flags });
        setTStates(engineRef.current.tStates);
        setMemRev(v => v + 1);
    };

    const getMemoryValue = (addr) => {
        // Dependent on memRev to force update during render
        return engineRef.current.toHex(engineRef.current.getMem(addr));
    };

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Actions ---

    const handleAssemble = () => {
        const res = engineRef.current.assemble(code);
        if (res.success) {
            setStatusMsg(res.message);
            syncState();
        } else {
            setStatusMsg('Assembly Failed');
        }
    };

    const handleStep = () => {
        const success = engineRef.current.step();
        if (success) {
            syncState();
            setStatusMsg(`Stepped to ${engineRef.current.toHex(engineRef.current.registers.PC, 4)}`);
        } else {
            setStatusMsg(engineRef.current.halted ? 'Halted' : 'Error');
        }
    };

    const handleRun = () => {
        clearInterval(intervalRef.current); // safe clear
        let steps = 0;
        const maxSteps = 10000; // Increased limit
        while (!engineRef.current.halted && steps < maxSteps) {
            engineRef.current.step();
            steps++;
        }
        syncState();
        setStatusMsg(engineRef.current.halted ? 'Program Halted' : 'Max Steps Reached');
    };

    const handleSlowRun = () => {
        clearInterval(intervalRef.current);
        if (engineRef.current.halted) return;

        setStatusMsg('Running Slowly...');
        intervalRef.current = setInterval(() => {
            if (engineRef.current.halted) {
                clearInterval(intervalRef.current);
                setStatusMsg('Program Halted');
                syncState();
                return;
            }
            const success = engineRef.current.step();
            syncState();
            if (!success || engineRef.current.halted) {
                clearInterval(intervalRef.current);
                setStatusMsg(engineRef.current.halted ? 'Program Halted' : 'Error');
            }
        }, 1000); // 1s delay
    };

    const handleStop = () => {
        clearInterval(intervalRef.current);
        engineRef.current.halted = true;
        setStatusMsg('Stopped by User');
        syncState();
    };

    const handleReset = () => {
        clearInterval(intervalRef.current);
        engineRef.current.reset();
        syncState();
        setStatusMsg('System Reset');
    };

    const addMemoryBlock = () => {
        const addr = parseInt(newMemAddr, 16);
        if (!isNaN(addr)) {
            setMemoryBlocks([...memoryBlocks, { start: addr, length: 256 }]);
            setNewMemAddr('');
        }
    };

    const removeMemoryBlock = (index) => {
        const newBlocks = [...memoryBlocks];
        newBlocks.splice(index, 1);
        setMemoryBlocks(newBlocks);
    }

    // --- Memory Editing ---
    const startEditing = (addr, currentVal) => {
        setEditingCell(addr);
        setEditValue(currentVal);
    };

    const commitEdit = () => {
        if (editingCell !== null) {
            const val = parseInt(editValue, 16);
            if (!isNaN(val)) {
                engineRef.current.setMem(editingCell, val);
                syncState();
            }
            setEditingCell(null);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            commitEdit();
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    if (!isDesktop) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-center px-4">
                <div className="bg-secondary p-8 rounded-xl border border-accent/20 shadow-2xl max-w-md">
                    <FaMicrochip className="text-6xl text-accent mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Desktop View Required</h2>
                    <p className="text-gray-400">
                        The Sim8085 Simulator requires a wider screen for the complex interface. Please switch to a desktop device to access this feature.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1920px] mx-auto px-4 py-4 h-[calc(100vh-64px)] flex flex-col bg-primary text-gray-300 font-sans overflow-hidden">

            {/* Toolbar */}
            <div className="bg-secondary border border-gray-800 rounded-t-lg p-2 flex items-center gap-2 shadow-md mb-0.5 shrink-0">
                <button
                    onClick={handleAssemble}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium border border-gray-700 transition-colors"
                >
                    <FaCog /> Assemble
                </button>
                <div className="w-px h-6 bg-gray-700 mx-1"></div>
                <button
                    onClick={handleStep}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium border border-gray-700 transition-colors"
                >
                    <FaStepForward /> Single Step
                </button>
                <button
                    onClick={handleRun}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-900/40 text-green-400 hover:bg-green-900/60 rounded text-xs font-medium border border-green-800/50 transition-colors"
                >
                    <FaPlay /> Run
                </button>
                <button
                    onClick={handleSlowRun}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/40 text-blue-400 hover:bg-blue-900/60 rounded text-xs font-medium border border-blue-800/50 transition-colors"
                >
                    <FaClock /> Slow Run
                </button>
                <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium border border-gray-700 transition-colors"
                >
                    <FaStop /> Stop
                </button>
                <div className="w-px h-6 bg-gray-700 mx-1"></div>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-900/40 text-red-400 hover:bg-red-900/60 rounded text-xs font-medium border border-red-800/50 transition-colors"
                >
                    <FaUndo /> Reset
                </button>

                <span className="ml-auto text-xs text-accent font-mono border border-accent/20 px-2 py-0.5 rounded bg-accent/5">
                    {statusMsg}
                </span>
            </div>

            {/* Main Content Grid */}
            <div className="flex-grow grid grid-cols-12 gap-0.5 border border-gray-800 border-t-0 bg-gray-900 min-h-0">

                {/* Editor (Left) */}
                <div className="col-span-12 lg:col-span-5 flex flex-col border-r border-gray-800 bg-secondary h-full">
                    <div className="bg-gray-800/50 px-3 py-1 border-b border-gray-800 flex justify-between items-center text-[10px] text-gray-500 font-mono uppercase tracking-wider shrink-0">
                        <span>Source Code</span>
                        <span>main.asm</span>
                    </div>
                    <div className="flex-grow relative h-full">
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-black/20 border-r border-gray-800 text-right pr-2 pt-4 text-gray-600 font-mono text-xs leading-6 select-none">
                            {[...Array(50)].map((_, i) => <div key={i}>{i + 1}</div>)}
                        </div>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full h-full bg-transparent pl-10 p-4 font-mono text-sm text-blue-300 resize-none focus:outline-none leading-6 selection:bg-accent/30"
                            spellCheck="false"
                            placeholder="; Enter 8085 Assembly Code Here..."
                        />
                    </div>
                </div>

                {/* Right Panel */}
                <div className="col-span-12 lg:col-span-7 flex flex-col bg-secondary h-full min-h-0">

                    {/* Registers & Flags (Top Right) */}
                    <div className="h-1/2 border-b border-gray-800 p-4 shrink-0 overflow-y-auto custom-scrollbar">
                        <div className="flex gap-4 h-full">
                            {/* General Purpose Registers */}
                            <div className="flex-grow border border-gray-800 rounded bg-black/20 p-3">
                                <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-3 font-semibold">8085 Registers</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-sm">
                                    {/* Register Pairs */}
                                    <div className="flex items-center justify-between border-b border-gray-800 pb-1">
                                        <span className="text-accent font-bold">A</span>
                                        <span className="bg-primary px-2 py-0.5 rounded text-white border border-gray-700">
                                            {engineRef.current.toHex(registers.A)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-gray-800 pb-1 opacity-50">
                                        <span className="text-gray-500">F</span>
                                        <span className="bg-primary px-2 py-0.5 rounded text-gray-500 border border-gray-800">--</span>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-gray-800 pb-1">
                                        <span className="text-gray-400">B</span>
                                        <span className="bg-primary px-2 py-0.5 rounded text-gray-300 border border-gray-700">
                                            {engineRef.current.toHex(registers.B)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-gray-800 pb-1">
                                        <span className="text-gray-400">C</span>
                                        <span className="bg-primary px-2 py-0.5 rounded text-gray-300 border border-gray-700">
                                            {engineRef.current.toHex(registers.C)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-gray-800 pb-1">
                                        <span className="text-gray-400">D</span>
                                        <span className="bg-primary px-2 py-0.5 rounded text-gray-300 border border-gray-700">
                                            {engineRef.current.toHex(registers.D)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-gray-800 pb-1">
                                        <span className="text-gray-400">E</span>
                                        <span className="bg-primary px-2 py-0.5 rounded text-gray-300 border border-gray-700">
                                            {engineRef.current.toHex(registers.E)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-gray-800 pb-1">
                                        <span className="text-gray-400">H</span>
                                        <span className="bg-primary px-2 py-0.5 rounded text-gray-300 border border-gray-700">
                                            {engineRef.current.toHex(registers.H)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-gray-800 pb-1">
                                        <span className="text-gray-400">L</span>
                                        <span className="bg-primary px-2 py-0.5 rounded text-gray-300 border border-gray-700">
                                            {engineRef.current.toHex(registers.L)}
                                        </span>
                                    </div>

                                    <div className="col-span-2 mt-2 pt-2 border-t border-gray-800 grid grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-accent text-xs">PC</span>
                                            <span className="bg-primary px-2 py-0.5 rounded text-white border border-gray-700 tracking-wider">
                                                {engineRef.current.toHex(registers.PC, 4)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-accent text-xs">SP</span>
                                            <span className="bg-primary px-2 py-0.5 rounded text-white border border-gray-700 tracking-wider">
                                                {engineRef.current.toHex(registers.SP, 4)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Flags */}
                            <div className="w-1/2 border border-gray-800 rounded bg-black/20 p-3 flex flex-col">
                                <div className="flex justify-between mb-4">
                                    {['S', 'Z', 'AC', 'P', 'CY'].map(f => (
                                        <div key={f} className="text-center">
                                            <div className="text-[10px] text-gray-500 font-bold mb-1">{f}</div>
                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold border ${flags[f] ? 'bg-accent/20 border-accent text-accent' : 'bg-primary border-gray-700 text-gray-600'}`}>
                                                {flags[f]}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-[10px] text-gray-500 text-center mt-auto mb-2">
                                    Click buttons to toggle flags (Disabled)
                                </div>

                                <div className="mt-2 flex items-center justify-between bg-black/40 px-3 py-2 rounded border border-gray-700/50">
                                    <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">T-States</span>
                                    <span className="text-accent font-mono text-lg font-bold">{tStates}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Memory (Bottom Right) */}
                    <div className="h-1/2 flex flex-col p-4 min-h-0">
                        <div className="flex justify-between items-center mb-2 shrink-0">
                            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Memory & I/O</h3>
                            <div className="flex gap-2">
                                <div className="flex items-center bg-gray-800 rounded overflow-hidden border border-gray-700">
                                    <span className="px-2 text-[10px] text-gray-500 border-r border-gray-700">Add Addr</span>
                                    <input
                                        type="text"
                                        value={newMemAddr}
                                        onChange={(e) => setNewMemAddr(e.target.value.toUpperCase())}
                                        placeholder="8000"
                                        className="w-16 px-2 py-0.5 bg-transparent text-xs text-white focus:outline-none font-mono"
                                        maxLength={4}
                                    />
                                    <button
                                        onClick={addMemoryBlock}
                                        className="px-2 py-0.5 hover:bg-gray-700 text-accent transition-colors"
                                    >
                                        <FaPlus size={10} />
                                    </button>
                                </div>
                                <button onClick={() => setMemoryBlocks([])} className="text-[10px] bg-red-900/20 px-2 py-0.5 rounded text-red-400 hover:text-white border border-red-800/40">Clear View</button>
                            </div>
                        </div>
                        <div className="flex-grow bg-primary border border-gray-800 rounded overflow-hidden flex min-h-0">

                            {/* Memory Columns Container */}
                            <div className="flex-grow flex overflow-x-auto overflow-y-hidden">
                                {memoryBlocks.map((block, idx) => (
                                    <div key={idx} className="w-96 border-r border-gray-800 flex flex-col shrink-0">
                                        <div className="flex bg-gray-800/50 text-[10px] text-gray-400 font-semibold border-b border-gray-800 shrink-0 relative group">
                                            <div className="w-24 px-2 py-1 border-r border-gray-700/50">Address</div>
                                            <div className="w-12 px-2 py-1 text-center border-r border-gray-700/50">Data</div>
                                            <div className="w-32 px-2 py-1 text-center border-r border-gray-700/50">IO Port</div>
                                            <div className="w-12 px-2 py-1 text-center">Data</div>

                                            <button
                                                onClick={() => removeMemoryBlock(idx)}
                                                className="absolute right-0 top-0 bottom-0 px-2 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >
                                                <FaTimes size={10} />
                                            </button>
                                        </div>
                                        <div className="overflow-y-auto font-mono text-xs custom-scrollbar">
                                            {[...Array(block.length)].map((_, i) => {
                                                const addr = block.start + i;
                                                const addrHex = addr.toString(16).toUpperCase().padStart(4, '0');
                                                const val = getMemoryValue(addr);
                                                const ioPort = (addr & 0xFF).toString(16).toUpperCase().padStart(2, '0');

                                                return (
                                                    <div
                                                        key={addr}
                                                        className={`flex hover:bg-white/5 cursor-pointer ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}
                                                    >
                                                        <div className="w-24 px-2 py-0.5 text-gray-500 border-r border-gray-800 font-mono">{addrHex}</div>

                                                        {/* Editable Data Cell */}
                                                        {editingCell === addr ? (
                                                            <div className="w-12 border-r border-gray-800 p-0">
                                                                <input
                                                                    autoFocus
                                                                    className="w-full h-full bg-accent/20 text-accent text-center focus:outline-none"
                                                                    value={editValue}
                                                                    onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                                                                    onBlur={commitEdit}
                                                                    onKeyDown={handleKeyDown}
                                                                    maxLength={2}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="w-12 px-2 py-0.5 text-center text-accent border-r border-gray-800 font-bold hover:bg-white/10"
                                                                onClick={() => startEditing(addr, val)}
                                                            >
                                                                {val}
                                                            </div>
                                                        )}

                                                        <div className="w-32 px-2 py-0.5 text-center text-gray-600 border-r border-gray-800">{ioPort}</div>
                                                        <div className="w-12 px-2 py-0.5 text-center text-gray-500">00</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {memoryBlocks.length === 0 && (
                                    <div className="flex-grow flex items-center justify-center text-gray-600 text-sm italic">
                                        Address Space Empty. Add an address to view.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Sim8085;
