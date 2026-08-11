import { Injectable } from '@nestjs/common'
import { EncryptionPort } from '../../application/ports/encryption.port'
import * as crypto from 'crypto'

@Injectable()
export class CryptoService implements EncryptionPort {
   private readonly algorithm = 'aes-256-cbc'
   private readonly key: Buffer

   constructor() {
      // Use standard env key or fallback to a default dev key
      const secret = process.env.ENCRYPTION_KEY || 'default_secret_key_must_be_32_bytes_long_!'
      this.key = crypto.createHash('sha256').update(secret).digest()
   }

   async encrypt(text: string): Promise<Buffer> {
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
      const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
      // Store IV at the beginning of the buffer
      return Buffer.concat([iv, encrypted])
   }

   async decrypt(buffer: Buffer): Promise<string> {
      if (buffer.length < 16) {
         throw new Error('Encrypted data is invalid or truncated')
      }
      const iv = buffer.subarray(0, 16)
      const encryptedContent = buffer.subarray(16)
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
      const decrypted = Buffer.concat([decipher.update(encryptedContent), decipher.final()])
      return decrypted.toString('utf8')
   }
}
