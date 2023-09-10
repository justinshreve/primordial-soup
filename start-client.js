import * as child from 'child_process';

const args = ['start'];
const opts = { stdio: 'inherit', cwd: 'client', shell: true };
child.spawn('npm', args, opts);
