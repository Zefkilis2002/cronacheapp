function createSemaphore(limit, timeout = 20000) {
  let active = 0;
  const queue = [];
  const enter = () => {
    active++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      active--;
      const next = queue.shift();
      if (next) { clearTimeout(next.timer); next.resolve(enter()); }
    };
  };
  return () => {
    if (active < limit) return Promise.resolve(enter());
    return new Promise((resolve, reject) => {
      const waiter = { resolve };
      waiter.timer = setTimeout(() => {
        const index = queue.indexOf(waiter);
        if (index >= 0) queue.splice(index, 1);
        reject(new Error('Server occupato: riprova tra qualche secondo'));
      }, timeout);
      queue.push(waiter);
    });
  };
}
module.exports = { createSemaphore };
