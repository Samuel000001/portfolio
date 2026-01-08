import { OPCODES } from './opcodes.js';

export class Sim8085Engine {
    constructor() {
        this.reset();
        this.OPCODES = OPCODES;
    }

    reset() {
        this.registers = {
            A: 0, B: 0, C: 0, D: 0, E: 0, H: 0, L: 0,
            PC: 0, SP: 0xFFFF
        };
        this.flags = {
            S: 0, Z: 0, AC: 0, P: 0, CY: 0
        };
        this.memory = new Map();
        this.program = [];
        this.labels = new Map();
        this.halted = false;
        this.im = 0;
        this.tStates = 0;
        this.lastExecutedSourceLine = -1;
    }

    // --- Helpers ---
    toHex(val, width = 2) {
        return val.toString(16).toUpperCase().padStart(width, '0');
    }

    getReg(name) {
        return this.registers[name];
    }

    setReg(name, val) {
        this.registers[name] = val & 0xFF;
    }

    setRegPair(high, low, val) {
        this.setReg(high, (val >> 8) & 0xFF);
        this.setReg(low, val & 0xFF);
    }

    getRegPair(high, low) {
        return (this.getReg(high) << 8) | this.getReg(low);
    }

    getMem(addr) {
        return this.memory.get(addr) || 0;
    }

    setMem(addr, val) {
        this.memory.set(addr, val & 0xFF);
    }

    updateFlags(result, isSubtraction = false, incDec = false) {
        // Z, S, P are common
        this.flags.Z = (result & 0xFF) === 0 ? 1 : 0;
        this.flags.S = (result & 0x80) !== 0 ? 1 : 0;
        this.flags.P = this.parity(result & 0xFF);

        // CY is not affected by INR/DCR
        if (!incDec) {
            this.flags.CY = (result > 0xFF || result < 0) ? 1 : 0;
        }

        // Simplified AC (Aux Carry) - accurate enough for most student BCD tasks
        // Strictly: AC is carry from bit 3 -> 4
        // Logic: (a & 0xF) + (b & 0xF) > 0xF
        this.flags.AC = 0;
    }

    parity(val) {
        let p = 0;
        for (let i = 0; i < 8; i++) {
            if ((val >> i) & 1) p++;
        }
        return (p % 2 === 0) ? 1 : 0;
    }

    // --- Assembler ---
    assemble(sourceCode) {
        // Do NOT reset memory. Only reset assembler state.
        this.labels = new Map();
        this.program = [];
        this.halted = false;

        const lines = sourceCode.split('\n');

        // --- Pass 1: Label Resolution ---
        let addr = 0x8000;
        lines.forEach(line => {
            let clean = line.split(';')[0].trim();
            if (!clean) return;

            if (clean.includes(':')) {
                const [lbl, content] = clean.split(':');
                this.labels.set(lbl.trim(), addr);
                clean = content ? content.trim() : '';
            }
            if (!clean) return;

            const tokens = clean.split(/[\s,]+/);
            const opcode = tokens[0].toUpperCase();
            addr += this.getInstrLength(opcode);
        });

        // --- Pass 2: Code Generation ---
        addr = 0x8000;

        lines.forEach((line, idx) => {
            let clean = line.split(';')[0].trim();
            if (!clean) return;
            if (clean.includes(':')) clean = clean.split(':')[1]?.trim() || '';
            if (!clean) return;

            const tokens = clean.split(/[\s,]+/);
            const opcode = tokens[0].toUpperCase();
            const operands = tokens.slice(1);
            const instrStart = addr;

            let sig = opcode + (operands.length > 0 ? ' ' + operands.join(',') : '');
            let hex = this.OPCODES[sig];

            // Fallback matching
            if (hex === undefined && operands.length > 0) {
                if (this.OPCODES[opcode] !== undefined) hex = this.OPCODES[opcode];
                else if (operands.length > 0) {
                    let partial = opcode + ' ' + operands[0];
                    if (this.OPCODES[partial] !== undefined) hex = this.OPCODES[partial];
                }
            }

            if (hex !== undefined) {
                this.setMem(addr, hex);
                addr++;

                const len = this.getInstrLength(opcode);
                if (len === 2) {
                    let valExpr = operands.length > 1 && ['MVI', 'LXI'].includes(opcode) ? operands[1] : operands[0];
                    if (['MVI'].includes(opcode)) valExpr = operands[1];

                    const val = this.parseVal(valExpr);
                    this.setMem(addr, val & 0xFF);
                    addr++;
                } else if (len === 3) {
                    let valExpr = operands[0];
                    if (['LXI'].includes(opcode)) valExpr = operands[1];

                    const val = this.parseVal(valExpr);
                    this.setMem(addr, val & 0xFF);
                    this.setMem(addr + 1, (val >> 8) & 0xFF);
                    addr += 2;
                }

                // Store 1-based line index
                this.program.push({ address: instrStart, opcode, operands, hex, sourceLine: idx + 1 });
            } else {
                console.warn(`Unknown instruction line ${idx + 1}: ${clean}`);
            }
        });

        if (this.program.length > 0) this.registers.PC = 0x8000;
        return { success: true, message: `Assembled ${this.program.length} instructions to 0x8000` };
    }

    getSourceLine(pc) {
        const instr = this.program.find(i => i.address === pc);
        return instr ? instr.sourceLine : -1;
    }

    getInstrLength(opcode) {
        if (['MVI', 'ADI', 'ACI', 'SUI', 'SBI', 'ANI', 'ORI', 'XRI', 'CPI', 'OUT', 'IN'].includes(opcode)) return 2;
        if (['LXI', 'LDA', 'STA', 'LHLD', 'SHLD', 'JMP', 'JC', 'JZ', 'JNC', 'JNZ', 'JP', 'JM', 'JPE', 'JPO', 'CALL', 'CC', 'CNC', 'CZ', 'CNZ', 'CP', 'CM', 'CPE', 'CPO'].includes(opcode)) return 3;
        return 1;
    }

    parseVal(str) {
        if (!str) return 0;
        if (this.labels.has(str)) return this.labels.get(str);
        if (str.endsWith('H') || str.endsWith('h')) return parseInt(str.slice(0, -1), 16);
        const int = parseInt(str, 10);
        return isNaN(int) ? 0 : int;
    }

    // --- Execution ---
    step() {
        if (this.halted) return false;

        const instr = this.program.find(i => i.address === this.registers.PC);
        // Fallback: if not in "program" (e.g. jmp to unmapped area), check memory for HLT
        if (!instr) {
            if (this.getMem(this.registers.PC) === 0x76) {
                this.halted = true;
                return false;
            }
        }
        if (!instr) return false;

        // Track last executed line
        this.lastExecutedSourceLine = instr.sourceLine;

        const { opcode, operands } = instr;
        let nextPC = this.registers.PC + this.getInstrLength(opcode);
        let jumped = false;

        switch (opcode) {
            // --- Data Transfer ---
            case 'MOV':
                {
                    const dest = operands[0];
                    const src = operands[1];
                    let val = 0;
                    if (src === 'M') val = this.getMem(this.getRegPair('H', 'L'));
                    else val = this.getReg(src);

                    if (dest === 'M') this.setMem(this.getRegPair('H', 'L'), val);
                    else this.setReg(dest, val);
                }
                break;
            case 'MVI':
                {
                    const reg = operands[0];
                    const val = this.parseVal(operands[1]);
                    if (reg === 'M') this.setMem(this.getRegPair('H', 'L'), val);
                    else this.setReg(reg, val);
                }
                break;
            case 'LXI':
                {
                    const pair = operands[0];
                    const val = this.parseVal(operands[1]);
                    if (pair === 'B') this.setRegPair('B', 'C', val);
                    if (pair === 'D') this.setRegPair('D', 'E', val);
                    if (pair === 'H') this.setRegPair('H', 'L', val);
                    if (pair === 'SP') this.registers.SP = val;
                }
                break;
            case 'LDA':
                this.registers.A = this.getMem(this.parseVal(operands[0]));
                break;
            case 'STA':
                this.setMem(this.parseVal(operands[0]), this.registers.A);
                break;
            case 'LHLD':
                {
                    const addr = this.parseVal(operands[0]);
                    this.registers.L = this.getMem(addr);
                    this.registers.H = this.getMem(addr + 1);
                }
                break;
            case 'SHLD':
                {
                    const addr = this.parseVal(operands[0]);
                    this.setMem(addr, this.registers.L);
                    this.setMem(addr + 1, this.registers.H);
                }
                break;
            case 'LDAX':
                {
                    const pair = operands[0]; // B or D
                    const addr = (pair === 'B') ? this.getRegPair('B', 'C') : this.getRegPair('D', 'E');
                    this.registers.A = this.getMem(addr);
                }
                break;
            case 'STAX':
                {
                    const pair = operands[0];
                    const addr = (pair === 'B') ? this.getRegPair('B', 'C') : this.getRegPair('D', 'E');
                    this.setMem(addr, this.registers.A);
                }
                break;
            case 'XCHG':
                {
                    const tempH = this.registers.H;
                    const tempL = this.registers.L;
                    this.registers.H = this.registers.D;
                    this.registers.L = this.registers.E;
                    this.registers.D = tempH;
                    this.registers.E = tempL;
                }
                break;

            // --- Arithmetic ---
            case 'ADD': case 'ADC':
                {
                    const reg = operands[0];
                    let val = (reg === 'M') ? this.getMem(this.getRegPair('H', 'L')) : this.getReg(reg);
                    let carry = (opcode === 'ADC') ? this.flags.CY : 0;
                    const res = this.registers.A + val + carry;
                    // AC logic approx
                    this.flags.AC = ((this.registers.A & 0xF) + (val & 0xF) + carry > 0xF) ? 1 : 0;
                    this.registers.A = res & 0xFF;
                    this.updateFlags(res);
                }
                break;
            case 'SUB': case 'SBB': case 'CMP':
                {
                    const reg = operands[0];
                    let val = (reg === 'M') ? this.getMem(this.getRegPair('H', 'L')) : this.getReg(reg);
                    let borrow = (opcode === 'SBB') ? this.flags.CY : 0;
                    let res = this.registers.A - val - borrow;
                    this.updateFlags(res, true);
                    if (opcode !== 'CMP') {
                        this.registers.A = res & 0xFF;
                        // Adjust Carry for Subtraction (Result < 0 sets Carry)
                        this.flags.CY = (res < 0) ? 1 : 0;
                    } else {
                        this.flags.CY = (res < 0) ? 1 : 0; // CMP sets CY if A < Reg
                    }
                }
                break;
            case 'ADI': case 'ACI':
                {
                    const val = this.parseVal(operands[0]);
                    let carry = (opcode === 'ACI') ? this.flags.CY : 0;
                    const res = this.registers.A + val + carry;
                    this.flags.AC = ((this.registers.A & 0xF) + (val & 0xF) + carry > 0xF) ? 1 : 0;
                    this.registers.A = res & 0xFF;
                    this.updateFlags(res);
                }
                break;
            case 'SUI': case 'SBI': case 'CPI':
                {
                    const val = this.parseVal(operands[0]);
                    let borrow = (opcode === 'SBI') ? this.flags.CY : 0;
                    let res = this.registers.A - val - borrow;
                    this.updateFlags(res, true);
                    if (opcode !== 'CPI') this.registers.A = res & 0xFF;
                    this.flags.CY = (res < 0) ? 1 : 0;
                }
                break;
            case 'INR':
                {
                    const reg = operands[0];
                    let val = (reg === 'M') ? this.getMem(this.getRegPair('H', 'L')) : this.getReg(reg);
                    val = (val + 1) & 0xFF;
                    if (reg === 'M') this.setMem(this.getRegPair('H', 'L'), val);
                    else this.setReg(reg, val);
                    this.updateFlags(val, false, true); // incDec=true to keep CY
                }
                break;
            case 'DCR':
                {
                    const reg = operands[0];
                    let val = (reg === 'M') ? this.getMem(this.getRegPair('H', 'L')) : this.getReg(reg);
                    val = (val - 1) & 0xFF;
                    if (reg === 'M') this.setMem(this.getRegPair('H', 'L'), val);
                    else this.setReg(reg, val);
                    this.updateFlags(val, true, true);
                }
                break;
            case 'INX':
                {
                    const pair = operands[0];
                    if (pair === 'B') this.setRegPair('B', 'C', this.getRegPair('B', 'C') + 1);
                    if (pair === 'D') this.setRegPair('D', 'E', this.getRegPair('D', 'E') + 1);
                    if (pair === 'H') this.setRegPair('H', 'L', this.getRegPair('H', 'L') + 1);
                    if (pair === 'SP') this.registers.SP = (this.registers.SP + 1) & 0xFFFF;
                }
                break;
            case 'DCX':
                {
                    const pair = operands[0];
                    if (pair === 'B') this.setRegPair('B', 'C', this.getRegPair('B', 'C') - 1);
                    if (pair === 'D') this.setRegPair('D', 'E', this.getRegPair('D', 'E') - 1);
                    if (pair === 'H') this.setRegPair('H', 'L', this.getRegPair('H', 'L') - 1);
                    if (pair === 'SP') this.registers.SP = (this.registers.SP - 1) & 0xFFFF;
                }
                break;
            case 'DAD':
                {
                    const pair = operands[0];
                    let val = 0;
                    if (pair === 'B') val = this.getRegPair('B', 'C');
                    if (pair === 'D') val = this.getRegPair('D', 'E');
                    if (pair === 'H') val = this.getRegPair('H', 'L');
                    if (pair === 'SP') val = this.registers.SP;

                    const hl = this.getRegPair('H', 'L');
                    const res = hl + val;
                    this.setRegPair('H', 'L', res);
                    this.flags.CY = (res > 0xFFFF) ? 1 : 0;
                }
                break;
            case 'DAA':
                {
                    let val = this.registers.A;
                    let corr = 0;
                    if ((val & 0x0F) > 9 || this.flags.AC) corr += 0x06;
                    if ((val >> 4) > 9 || this.flags.CY || ((val >> 4) >= 9 && (val & 0xF) > 9)) {
                        corr += 0x60;
                        this.flags.CY = 1;
                    }
                    this.registers.A = (val + corr) & 0xFF;
                    this.updateFlags(this.registers.A);
                }
                break;

            // --- Logical ---
            case 'ANA': case 'ORA': case 'XRA':
                {
                    const reg = operands[0];
                    let val = (reg === 'M') ? this.getMem(this.getRegPair('H', 'L')) : this.getReg(reg);
                    let res = 0;
                    if (opcode === 'ANA') res = this.registers.A & val;
                    if (opcode === 'ORA') res = this.registers.A | val;
                    if (opcode === 'XRA') res = this.registers.A ^ val;
                    this.registers.A = res & 0xFF;
                    this.updateFlags(res);
                    this.flags.CY = 0; this.flags.AC = 0; // ANA/ORA/XRA clear CY/AC usually (ANA sets AC logic on some chips, assuming clear)
                }
                break;
            case 'ANI': case 'ORI': case 'XRI':
                {
                    const val = this.parseVal(operands[0]);
                    let res = 0;
                    if (opcode === 'ANI') res = this.registers.A & val;
                    if (opcode === 'ORI') res = this.registers.A | val;
                    if (opcode === 'XRI') res = this.registers.A ^ val;
                    this.registers.A = res & 0xFF;
                    this.updateFlags(res);
                    this.flags.CY = 0;
                }
                break;
            case 'RLC':
                {
                    const bit7 = (this.registers.A >> 7) & 1;
                    this.registers.A = ((this.registers.A << 1) | bit7) & 0xFF;
                    this.flags.CY = bit7;
                }
                break;
            case 'RRC':
                {
                    const bit0 = this.registers.A & 1;
                    this.registers.A = ((this.registers.A >> 1) | (bit0 << 7)) & 0xFF;
                    this.flags.CY = bit0;
                }
                break;
            case 'RAL':
                {
                    const bit7 = (this.registers.A >> 7) & 1;
                    this.registers.A = ((this.registers.A << 1) | this.flags.CY) & 0xFF;
                    this.flags.CY = bit7;
                }
                break;
            case 'RAR':
                {
                    const bit0 = this.registers.A & 1;
                    this.registers.A = ((this.registers.A >> 1) | (this.flags.CY << 7)) & 0xFF;
                    this.flags.CY = bit0;
                }
                break;
            case 'CMA':
                this.registers.A = (~this.registers.A) & 0xFF;
                break;
            case 'CMC':
                this.flags.CY = this.flags.CY ? 0 : 1;
                break;
            case 'STC':
                this.flags.CY = 1;
                break;

            // --- Branching ---
            case 'JMP':
            case 'JC': case 'JNC': case 'JZ': case 'JNZ': case 'JP': case 'JM': case 'JPE': case 'JPO':
                {
                    const target = this.parseVal(operands[0]);
                    let jump = false;
                    if (opcode === 'JMP') jump = true;
                    else if (opcode === 'JC' && this.flags.CY) jump = true;
                    else if (opcode === 'JNC' && !this.flags.CY) jump = true;
                    else if (opcode === 'JZ' && this.flags.Z) jump = true;
                    else if (opcode === 'JNZ' && !this.flags.Z) jump = true;
                    else if (opcode === 'JP' && !this.flags.S) jump = true;
                    else if (opcode === 'JM' && this.flags.S) jump = true;
                    else if (opcode === 'JPE' && this.flags.P) jump = true;
                    else if (opcode === 'JPO' && !this.flags.P) jump = true;

                    if (jump) { nextPC = target; jumped = true; }
                }
                break;
            case 'CALL':
            case 'CC': case 'CNC': case 'CZ': case 'CNZ': case 'CP': case 'CM': case 'CPE': case 'CPO':
                {
                    const target = this.parseVal(operands[0]);
                    let call = false;
                    if (opcode === 'CALL') call = true;
                    else if (opcode === 'CC' && this.flags.CY) call = true;
                    else if (opcode === 'CNC' && !this.flags.CY) call = true;
                    else if (opcode === 'CZ' && this.flags.Z) call = true;
                    else if (opcode === 'CNZ' && !this.flags.Z) call = true;
                    else if (opcode === 'CP' && !this.flags.S) call = true;
                    else if (opcode === 'CM' && this.flags.S) call = true;
                    else if (opcode === 'CPE' && this.flags.P) call = true;
                    else if (opcode === 'CPO' && !this.flags.P) call = true;

                    if (call) {
                        // Push PC (next instruction) to stack
                        this.setMem(this.registers.SP - 1, (nextPC >> 8) & 0xFF);
                        this.setMem(this.registers.SP - 2, nextPC & 0xFF);
                        this.registers.SP -= 2;
                        nextPC = target;
                        jumped = true;
                    }
                }
                break;
            case 'RET':
            case 'RC': case 'RNC': case 'RZ': case 'RNZ': case 'RP': case 'RM': case 'RPE': case 'RPO':
                {
                    let ret = false;
                    if (opcode === 'RET') ret = true;
                    else if (opcode === 'RC' && this.flags.CY) ret = true;
                    else if (opcode === 'RNC' && !this.flags.CY) ret = true;
                    else if (opcode === 'RZ' && this.flags.Z) ret = true;
                    else if (opcode === 'RNZ' && !this.flags.Z) ret = true;
                    else if (opcode === 'RP' && !this.flags.S) ret = true;
                    else if (opcode === 'RM' && this.flags.S) ret = true;
                    else if (opcode === 'RPE' && this.flags.P) ret = true;
                    else if (opcode === 'RPO' && !this.flags.P) ret = true;

                    if (ret) {
                        const low = this.getMem(this.registers.SP);
                        const high = this.getMem(this.registers.SP + 1);
                        this.registers.SP += 2;
                        nextPC = (high << 8) | low;
                        jumped = true;
                    }
                }
                break;
            case 'PCHL':
                nextPC = this.getRegPair('H', 'L');
                jumped = true;
                break;
            case 'RST':
                {
                    // RST 0..7
                    const n = parseInt(operands[0]);
                    const target = n * 8;
                    // Push PC
                    this.setMem(this.registers.SP - 1, (nextPC >> 8) & 0xFF);
                    this.setMem(this.registers.SP - 2, nextPC & 0xFF);
                    this.registers.SP -= 2;
                    nextPC = target;
                    jumped = true;
                }
                break;

            // --- Stack / Machine Control ---
            case 'PUSH':
                {
                    const pair = operands[0];
                    let val = 0;
                    if (pair === 'B') val = this.getRegPair('B', 'C');
                    if (pair === 'D') val = this.getRegPair('D', 'E');
                    if (pair === 'H') val = this.getRegPair('H', 'L');
                    if (pair === 'PSW') {
                        // A + Flags. Flags: S Z 0 AC 0 P 1 CY
                        const f = (this.flags.S << 7) | (this.flags.Z << 6) | (this.flags.AC << 4) | (this.flags.P << 2) | 0x02 | this.flags.CY;
                        val = (this.registers.A << 8) | f;
                    }

                    this.setMem(this.registers.SP - 1, (val >> 8) & 0xFF);
                    this.setMem(this.registers.SP - 2, val & 0xFF);
                    this.registers.SP -= 2;
                }
                break;
            case 'POP':
                {
                    const pair = operands[0];
                    const low = this.getMem(this.registers.SP);
                    const high = this.getMem(this.registers.SP + 1);
                    this.registers.SP += 2;
                    const val = (high << 8) | low;

                    if (pair === 'B') this.setRegPair('B', 'C', val);
                    if (pair === 'D') this.setRegPair('D', 'E', val);
                    if (pair === 'H') this.setRegPair('H', 'L', val);
                    if (pair === 'PSW') {
                        this.registers.A = (val >> 8) & 0xFF;
                        const f = val & 0xFF;
                        this.flags.S = (f >> 7) & 1;
                        this.flags.Z = (f >> 6) & 1;
                        this.flags.AC = (f >> 4) & 1;
                        this.flags.P = (f >> 2) & 1;
                        this.flags.CY = f & 1;
                    }
                }
                break;
            case 'XTHL':
                {
                    const spL = this.getMem(this.registers.SP);
                    const spH = this.getMem(this.registers.SP + 1);
                    const l = this.registers.L;
                    const h = this.registers.H;

                    this.setMem(this.registers.SP, l);
                    this.setMem(this.registers.SP + 1, h);
                    this.registers.L = spL;
                    this.registers.H = spH;
                }
                break;
            case 'SPHL':
                this.registers.SP = this.getRegPair('H', 'L');
                break;
            case 'EI': case 'DI': case 'RIM': case 'SIM': case 'NOP':
                // No-op for simulation context
                break;
            case 'IN':
                console.log(`IN port ${operands[0]}`); // Mock
                // Typically expects data on data bus
                break;
            case 'OUT':
                console.log(`OUT port ${operands[0]} val: ${this.registers.A}`);
                break;
            case 'HLT':
                this.halted = true;
                nextPC = this.registers.PC;
                break;
        }

        this.registers.PC = nextPC;

        // Calculate and add T-States
        const cycles = this.getCycles(opcode, operands, jumped);
        this.tStates += cycles;

        return true;
    }

    getCycles(opcode, operands, taken) {
        // Basic grouping based on Intel 8085 Datasheet
        // Data Transfer
        if (opcode === 'MOV') {
            if (operands[0] === 'M' || operands[1] === 'M') return 7;
            return 4;
        }
        if (opcode === 'MVI') {
            if (operands[0] === 'M') return 10;
            return 7;
        }
        if (['LXI', 'LDA', 'STA', 'LHLD', 'SHLD'].includes(opcode)) {
            if (opcode === 'LXI') return 10;
            if (opcode === 'LHLD' || opcode === 'SHLD') return 16;
            return 13; // LDA, STA
        }
        if (['LDAX', 'STAX'].includes(opcode)) return 7;
        if (opcode === 'XCHG') return 4;

        // Arithmetic
        if (['ADD', 'ADC', 'SUB', 'SBB', 'ANA', 'XRA', 'ORA', 'CMP'].includes(opcode)) {
            if (operands[0] === 'M') return 7;
            return 4;
        }
        if (['ADI', 'ACI', 'SUI', 'SBI', 'ANI', 'XRI', 'ORI', 'CPI'].includes(opcode)) return 7;
        if (opcode === 'INR' || opcode === 'DCR') {
            if (operands[0] === 'M') return 10;
            return 4;
        }
        if (['INX', 'DCX'].includes(opcode)) return 6;
        if (opcode === 'DAD') return 10;
        if (opcode === 'DAA') return 4;

        // Logical / Rotate
        if (['RLC', 'RRC', 'RAL', 'RAR', 'CMA', 'CMC', 'STC'].includes(opcode)) return 4;

        // Branching
        if (opcode === 'JMP') return 10;
        if (['JC', 'JNC', 'JZ', 'JNZ', 'JP', 'JM', 'JPE', 'JPO'].includes(opcode)) {
            return taken ? 10 : 7;
        }
        if (opcode === 'CALL') return 18;
        if (['CC', 'CNC', 'CZ', 'CNZ', 'CP', 'CM', 'CPE', 'CPO'].includes(opcode)) {
            return taken ? 18 : 9;
        }
        if (opcode === 'RET') return 10;
        if (['RC', 'RNC', 'RZ', 'RNZ', 'RP', 'RM', 'RPE', 'RPO'].includes(opcode)) {
            return taken ? 11 : 5;
        }
        if (opcode === 'RST') return 11;
        if (opcode === 'PCHL') return 5;

        // Stack / Control
        if (['PUSH'].includes(opcode)) return 11; // 11 or 12 depending on source? Actually 11 is standard.
        if (['POP'].includes(opcode)) return 10;
        if (['XTHL'].includes(opcode)) return 18;
        if (['SPHL'].includes(opcode)) return 5;
        if (['IN', 'OUT'].includes(opcode)) return 10;

        if (['EI', 'DI', 'NOP', 'HLT'].includes(opcode)) return 4;
        if (['RIM', 'SIM'].includes(opcode)) return 4;

        return 4; // Default safe fallback
    }
}
