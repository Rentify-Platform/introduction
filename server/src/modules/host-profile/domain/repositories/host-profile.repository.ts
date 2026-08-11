import { HostProfile } from '../entities/host-profile.entity'

export abstract class HostProfileRepository {
   abstract findByAccountId(accountId: string): Promise<HostProfile | null>
   abstract save(hostProfile: HostProfile): Promise<HostProfile>
   abstract getGuestKycStatus(accountId: string): Promise<string>
   abstract updateAccountRoleToHost(accountId: string): Promise<void>
}
