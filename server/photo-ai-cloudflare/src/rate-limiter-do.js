export const RATE_LIMITS=Object.freeze({minute:5,day:50,lockMs:90000});

export class PhotoAiRateLimiter {
  constructor(state){
    this.sql=state.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS events (created_at INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS locks (name TEXT PRIMARY KEY, token TEXT NOT NULL, expires_at INTEGER NOT NULL)');
  }
  acquire(now=Date.now()){
    this.sql.exec('DELETE FROM locks WHERE expires_at <= ?',now);
    this.sql.exec('DELETE FROM events WHERE created_at <= ?',now-86400000);
    if([...this.sql.exec('SELECT token FROM locks WHERE name = ?', 'analysis')].length)return null;
    const minute=[...this.sql.exec('SELECT COUNT(*) AS count FROM events WHERE created_at > ?',now-60000)][0].count;
    const day=[...this.sql.exec('SELECT COUNT(*) AS count FROM events WHERE created_at > ?',now-86400000)][0].count;
    if(minute>=RATE_LIMITS.minute||day>=RATE_LIMITS.day)return null;
    const token=crypto.randomUUID();
    this.sql.exec('INSERT INTO events (created_at) VALUES (?)',now);
    this.sql.exec('INSERT INTO locks (name,token,expires_at) VALUES (?,?,?)','analysis',token,now+RATE_LIMITS.lockMs);
    return token;
  }
  release(token){this.sql.exec('DELETE FROM locks WHERE name = ? AND token = ?','analysis',token);}
}
