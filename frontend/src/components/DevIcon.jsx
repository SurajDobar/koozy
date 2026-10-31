import React from 'react';
import { Terminal, Code2, Sparkles, BookOpen } from 'lucide-react';

/**
 * Registry of Devicon mappings for common tech topics, programming languages,
 * frameworks, and tools.
 */
export const DEVICON_MAP = [
  { match: ['python', 'py', 'django', 'flask', 'fastapi'], iconClass: 'devicon-python-plain colored', label: 'Python', color: '#3776AB', bg: '#e8f2fc' },
  { match: ['javascript', 'js', 'es6', 'ecmascript'], iconClass: 'devicon-javascript-plain colored', label: 'JavaScript', color: '#e5a00d', bg: '#fefde8' },
  { match: ['typescript', 'ts'], iconClass: 'devicon-typescript-plain colored', label: 'TypeScript', color: '#3178C6', bg: '#e8f1fc' },
  { match: ['react', 'reactjs', 'react native', 'jsx'], iconClass: 'devicon-react-original colored', label: 'React', color: '#00b4d8', bg: '#e6faff' },
  { match: ['html', 'html5', 'web', 'frontend'], iconClass: 'devicon-html5-plain colored', label: 'HTML5', color: '#E34F26', bg: '#feebe6' },
  { match: ['css', 'css3', 'styles', 'sass', 'scss'], iconClass: 'devicon-css3-plain colored', label: 'CSS3', color: '#1572B6', bg: '#e8f1f8' },
  { match: ['tailwind', 'tailwindcss'], iconClass: 'devicon-tailwindcss-original colored', label: 'Tailwind CSS', color: '#06B6D4', bg: '#e6fbfd' },
  { match: ['node', 'nodejs', 'npm'], iconClass: 'devicon-nodejs-plain colored', label: 'Node.js', color: '#339933', bg: '#eaf6ea' },
  { match: ['docker', 'container', 'devops'], iconClass: 'devicon-docker-plain colored', label: 'Docker', color: '#2496ED', bg: '#e6f4fc' },
  { match: ['git', 'github', 'gitlab', 'version control'], iconClass: 'devicon-git-plain colored', label: 'Git', color: '#F05032', bg: '#feeee9' },
  { match: ['rust', 'cargo'], iconClass: 'devicon-rust-plain colored', label: 'Rust', color: '#000000', bg: '#f0f0f0' },
  { match: ['go', 'golang'], iconClass: 'devicon-go-original-wordmark colored', label: 'Go', color: '#00ADD8', bg: '#e6f9fd' },
  { match: ['java', 'spring', 'jvm'], iconClass: 'devicon-java-plain colored', label: 'Java', color: '#007396', bg: '#e6f3f8' },
  { match: ['c++', 'cpp'], iconClass: 'devicon-cplusplus-plain colored', label: 'C++', color: '#00599C', bg: '#e6f0f8' },
  { match: ['c#', 'csharp', '.net', 'dotnet'], iconClass: 'devicon-csharp-plain colored', label: 'C#', color: '#239120', bg: '#eaf6ea' },
  { match: ['c', 'clang'], iconClass: 'devicon-c-plain colored', label: 'C', color: '#A8B9CC', bg: '#f2f4f8' },
  { match: ['php', 'laravel', 'wordpress'], iconClass: 'devicon-php-plain colored', label: 'PHP', color: '#777BB4', bg: '#f0f1f8' },
  { match: ['ruby', 'rails'], iconClass: 'devicon-ruby-plain colored', label: 'Ruby', color: '#CC342D', bg: '#feeceb' },
  { match: ['swift', 'ios'], iconClass: 'devicon-swift-plain colored', label: 'Swift', color: '#F05138', bg: '#feebe7' },
  { match: ['kotlin', 'android'], iconClass: 'devicon-kotlin-plain colored', label: 'Kotlin', color: '#7F52FF', bg: '#f2eeff' },
  { match: ['sql', 'mysql', 'database', 'rdbms'], iconClass: 'devicon-mysql-plain colored', label: 'MySQL', color: '#4479A1', bg: '#ecf3f8' },
  { match: ['postgres', 'postgresql'], iconClass: 'devicon-postgresql-plain colored', label: 'PostgreSQL', color: '#4169E1', bg: '#ecf1fc' },
  { match: ['mongo', 'mongodb', 'nosql'], iconClass: 'devicon-mongodb-plain colored', label: 'MongoDB', color: '#47A248', bg: '#ecf6ec' },
  { match: ['redis', 'cache'], iconClass: 'devicon-redis-plain colored', label: 'Redis', color: '#DC382D', bg: '#feeceb' },
  { match: ['linux', 'ubuntu', 'unix', 'debian'], iconClass: 'devicon-linux-plain colored', label: 'Linux', color: '#2d3748', bg: '#fefae8' },
  { match: ['bash', 'shell', 'terminal', 'sh', 'zsh'], iconClass: 'devicon-bash-plain colored', label: 'Bash', color: '#4EAA25', bg: '#ebfaeb' },
  { match: ['aws', 'amazon', 'cloud'], iconClass: 'devicon-amazonwebservices-plain-wordmark colored', label: 'AWS', color: '#FF9900', bg: '#fff7e6' },
  { match: ['vue', 'vuejs'], iconClass: 'devicon-vuejs-plain colored', label: 'Vue.js', color: '#4FC08D', bg: '#ecf9f3' },
  { match: ['angular', 'angularjs'], iconClass: 'devicon-angularjs-plain colored', label: 'Angular', color: '#DD0031', bg: '#fee6eb' },
  { match: ['next', 'nextjs'], iconClass: 'devicon-nextjs-plain colored', label: 'Next.js', color: '#000000', bg: '#f0f0f0' },
  { match: ['graphql'], iconClass: 'devicon-graphql-plain colored', label: 'GraphQL', color: '#E10098', bg: '#fde6f4' },
  { match: ['kubernetes', 'k8s'], iconClass: 'devicon-kubernetes-plain colored', label: 'Kubernetes', color: '#326CE5', bg: '#ecf2fc' },
  { match: ['flutter', 'dart'], iconClass: 'devicon-flutter-plain colored', label: 'Flutter', color: '#02569B', bg: '#e6f0f8' },
  { match: ['figma', 'design', 'ui', 'ux'], iconClass: 'devicon-figma-plain colored', label: 'Figma', color: '#F24E1E', bg: '#feece8' },
  { match: ['ai', 'machine learning', 'data science', 'deep learning', 'ml', 'neural'], iconClass: 'devicon-tensorflow-line colored', label: 'AI / ML', color: '#FF6F00', bg: '#fff3e6' },
];

/**
 * Popular presets for category selection & AI generation shortcuts.
 */
export const POPULAR_DEV_CATEGORIES = [
  { name: 'Python', icon: 'devicon-python-plain colored', color: '#3776AB', prompt: 'Python core concepts, data structures, and functions' },
  { name: 'JavaScript', icon: 'devicon-javascript-plain colored', color: '#e5a00d', prompt: 'Modern JavaScript (ES6+), async/await, closures, and DOM' },
  { name: 'React', icon: 'devicon-react-original colored', color: '#00b4d8', prompt: 'React hooks, state management, components, and lifecycle' },
  { name: 'Web Dev', icon: 'devicon-html5-plain colored', color: '#E34F26', prompt: 'HTML5, CSS layout, responsive design, and browser APIs' },
  { name: 'Docker & DevOps', icon: 'devicon-docker-plain colored', color: '#2496ED', prompt: 'Docker containers, images, compose, and CI/CD basics' },
  { name: 'Git & GitHub', icon: 'devicon-git-plain colored', color: '#F05032', prompt: 'Git branching, commits, merging, rebasing, and remote repos' },
  { name: 'SQL & Databases', icon: 'devicon-postgresql-plain colored', color: '#4169E1', prompt: 'SQL queries, joins, indexes, transactions, and database design' },
  { name: 'Data Structures', icon: 'devicon-cplusplus-plain colored', color: '#00599C', prompt: 'Arrays, linked lists, trees, graphs, sorting, and algorithms' },
  { name: 'Linux & Terminal', icon: 'devicon-linux-plain colored', color: '#2d3748', prompt: 'Linux commands, permissions, bash scripting, and processes' },
  { name: 'AI & Machine Learning', icon: 'devicon-tensorflow-line colored', color: '#FF6F00', prompt: 'Machine learning fundamentals, neural networks, and model training' },
];

/**
 * Intelligently resolves a keyword/category/title to a Devicon definition.
 */
export function resolveDevIcon(query = '') {
  if (!query || typeof query !== 'string') {
    return {
      iconClass: 'devicon-devicon-plain colored',
      label: 'Quiz',
      color: '#6c4de8',
      bg: '#eeeafd',
      isTech: false,
    };
  }

  const clean = query.toLowerCase().trim();
  const words = clean.split(/[\s,._/\\-]+/).filter(Boolean);

  // 1. Direct word or substring match safely without raw regex
  for (const item of DEVICON_MAP) {
    for (const m of item.match) {
      if (clean === m || clean.includes(m) || words.includes(m)) {
        return { ...item, isTech: true };
      }
    }
  }

  return {
    iconClass: 'devicon-devicon-plain colored',
    label: query,
    color: '#6c4de8',
    bg: '#eeeafd',
    isTech: false,
  };
}

/**
 * DevIcon - renders a devicon font icon or fallback icon
 */
export default function DevIcon({ name, className = '', size = 'text-xl', colored = true, fallback = null }) {
  const resolved = resolveDevIcon(name);

  // If name matches a specific devicon class directly (e.g. "devicon-python-plain")
  const directClass = name && typeof name === 'string' && name.startsWith('devicon-') ? name : null;
  const targetClass = directClass || resolved.iconClass;

  return (
    <i
      className={`${targetClass} ${size} ${className} inline-flex items-center justify-center align-middle transition-transform`}
      title={resolved.label || name}
      aria-label={resolved.label || name}
    />
  );
}

/**
 * TechBadge - A sleek, professional pill badge with Devicon + title.
 */
export function TechBadge({
  name,
  size = 'md',
  showLabel = true,
  active = false,
  onClick = null,
  className = '',
}) {
  const resolved = resolveDevIcon(name);

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs font-bold gap-2',
    lg: 'px-4 py-2 text-sm font-extrabold gap-2.5',
  };

  const iconSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const isClickable = Boolean(onClick);

  return (
    <button
      type={isClickable ? 'button' : undefined}
      onClick={onClick}
      disabled={!isClickable}
      className={`inline-flex items-center rounded-xl font-bold transition-all border ${sizeClasses[size] || sizeClasses.md} ${
        active
          ? 'bg-[#191817] text-white border-[#191817] shadow-[2px_2px_0_#6c4de8] -translate-y-0.5'
          : isClickable
          ? 'bg-white hover:bg-[#fffdf7] border-[#d8d3ca] hover:border-[#191817] text-[#191817] hover:shadow-[2px_2px_0_#191817] hover:-translate-y-0.5 cursor-pointer'
          : 'bg-[#fffdf7] border-[#d8d3ca] text-[#191817] shadow-xs'
      } ${className}`}
    >
      <i className={`${resolved.iconClass} ${iconSizes[size] || iconSizes.md} shrink-0`} />
      {showLabel && (
        <span className="truncate tracking-tight">
          {resolved.label || name}
        </span>
      )}
    </button>
  );
}
