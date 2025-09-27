// Seeder types and interfaces

export interface Seeder {
    name: string
    order: number
    run(): Promise<void>
    rollback(): Promise<void>
}

export interface SeederResult {
    success: boolean
    seeder: string
    recordsCreated: number
    recordsUpdated: number
    recordsDeleted: number
    executionTime: number
    error?: string
}

export interface SeederConfig {
    seedersPath: string
    tableName: string
    batchSize: number
    retryAttempts: number
    retryDelay: number
}

export interface SeederStatus {
    executedSeeders: string[]
    pendingSeeders: string[]
    failedSeeders: string[]
    lastExecuted?: Date
}

export interface SeederStats {
    totalSeeders: number
    executedSeeders: number
    pendingSeeders: number
    failedSeeders: number
    totalRecordsCreated: number
    totalExecutionTime: number
}

export interface SeederValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
}

export interface SeederDependency {
    seeder: string
    dependsOn: string[]
    order: number
}

export interface SeederGraph {
    nodes: string[]
    dependencies: SeederDependency[]
    executionOrder: string[]
    cycles: string[][]
}
