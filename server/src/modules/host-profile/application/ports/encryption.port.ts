export abstract class EncryptionPort {
   abstract encrypt(text: string): Promise<Buffer>
   abstract decrypt(buffer: Buffer): Promise<string>
}
