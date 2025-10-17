/**
 * CFA-DEMO Progress Tracker
 * Tracks execution progress across the 5-agent sequence
 */
export class CFADemoProgressTracker {
  constructor() {
    this.phases = [
      { 
        name: 'Market Sizing', 
        weight: 20, 
        description: 'Analyzing Swiss pension market by product',
        agentId: '68f229005e8b5435150c2991'
      },
      { 
        name: 'Competitive Analysis', 
        weight: 20, 
        description: 'Mapping competitive landscape and business models',
        agentId: '68f22dc0330210e8b8f60a43'
      },
      { 
        name: 'Capability Assessment', 
        weight: 20, 
        description: 'Benchmarking UBS capabilities vs competitors',
        agentId: '68f22f36330210e8b8f60a51'
      },
      { 
        name: 'Strategic Planning', 
        weight: 25, 
        description: 'Developing ecosystem strategy options',
        agentId: '68f23ae07e8d5848f940482d'
      },
      { 
        name: 'Partnership Strategy', 
        weight: 15, 
        description: 'Identifying implementation partnerships',
        agentId: '68f23be77e8d5848f9404847'
      }
    ];
    
    this.progress = 0;
    this.currentPhase = 0;
    this.callbacks = [];
    this.startTime = null;
    this.phaseStartTimes = {};
    this.phaseResults = {};
  }

  onProgress(callback) {
    this.callbacks.push(callback);
  }

  start() {
    this.startTime = Date.now();
    this.progress = 0;
    this.currentPhase = 0;
    this.updateCallbacks({
      phase: 'Initializing',
      progress: 0,
      status: 'starting',
      totalPhases: this.phases.length,
      elapsed: 0
    });
  }

  updateProgress(phaseIndex, status, result = null) {
    const phase = this.phases[phaseIndex];
    if (!phase) return;

    const now = Date.now();
    
    if (status === 'starting') {
      this.phaseStartTimes[phaseIndex] = now;
      this.currentPhase = phaseIndex;
      
      console.log(`📊 Starting ${phase.name} (${phaseIndex + 1}/${this.phases.length})`);
      
    } else if (status === 'completed') {
      const phaseStartTime = this.phaseStartTimes[phaseIndex] || now;
      const phaseDuration = now - phaseStartTime;
      
      this.progress += phase.weight;
      this.phaseResults[phaseIndex] = {
        phase: phase.name,
        duration: phaseDuration,
        result: result,
        completed: true
      };
      
      console.log(`✅ Completed ${phase.name} in ${phaseDuration}ms`);
      
    } else if (status === 'failed') {
      this.phaseResults[phaseIndex] = {
        phase: phase.name,
        duration: now - (this.phaseStartTimes[phaseIndex] || now),
        result: result,
        completed: false,
        failed: true
      };
      
      console.log(`❌ Failed ${phase.name}`);
    }

    const elapsed = this.startTime ? now - this.startTime : 0;
    
    this.updateCallbacks({
      phase: phase.name,
      phaseDescription: phase.description,
      progress: Math.min(100, this.progress),
      status,
      currentPhase: phaseIndex,
      totalPhases: this.phases.length,
      elapsed,
      estimatedRemaining: this.calculateEstimatedRemaining(),
      phaseResults: this.phaseResults
    });
  }

  updateCallbacks(data) {
    this.callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });
  }

  calculateEstimatedRemaining() {
    if (!this.startTime || this.progress === 0) return null;
    
    const elapsed = Date.now() - this.startTime;
    const progressRatio = this.progress / 100;
    const totalEstimated = elapsed / progressRatio;
    const remaining = totalEstimated - elapsed;
    
    return Math.max(0, remaining);
  }

  getExecutionSummary() {
    const totalElapsed = this.startTime ? Date.now() - this.startTime : 0;
    const completedPhases = Object.values(this.phaseResults).filter(r => r.completed).length;
    const failedPhases = Object.values(this.phaseResults).filter(r => r.failed).length;
    
    return {
      totalDuration: totalElapsed,
      completedPhases,
      failedPhases,
      totalPhases: this.phases.length,
      successRate: completedPhases / this.phases.length,
      phases: this.phases.map((phase, index) => ({
        ...phase,
        result: this.phaseResults[index] || null
      }))
    };
  }

  reset() {
    this.progress = 0;
    this.currentPhase = 0;
    this.startTime = null;
    this.phaseStartTimes = {};
    this.phaseResults = {};
  }

  // Get current status for UI display
  getCurrentStatus() {
    if (this.progress === 0) {
      return {
        status: 'not_started',
        message: 'Ready to begin CFA-DEMO analysis',
        progress: 0
      };
    }
    
    if (this.progress >= 100) {
      const summary = this.getExecutionSummary();
      return {
        status: 'completed',
        message: `CFA-DEMO analysis completed in ${Math.round(summary.totalDuration / 1000)}s`,
        progress: 100,
        summary
      };
    }
    
    const currentPhase = this.phases[this.currentPhase];
    return {
      status: 'in_progress',
      message: currentPhase ? `Executing: ${currentPhase.description}` : 'Processing...',
      progress: this.progress,
      currentPhase: this.currentPhase,
      totalPhases: this.phases.length
    };
  }

  // Format duration for display
  static formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  }
}