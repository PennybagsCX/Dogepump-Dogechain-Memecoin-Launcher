import { List } from 'react-window';
import { Token } from '../types';
import { TokenCard } from './TokenCard';

interface VirtualTokenListProps {
  tokens: Token[];
  height: number;
  itemSize: number;
}

export const VirtualTokenList = ({ tokens, height, itemSize }: VirtualTokenListProps) => {
  return (
    <List
      height={height}
      rowCount={tokens.length}
      rowHeight={itemSize}
      width="100%"
      {...{
        rowComponent: ({ index, style }: any) => {
          const token = tokens[index];
          return (
            <div key={token.id} style={style}>
              <TokenCard token={token} />
            </div>
          );
        }
      } as any}
    />
  );
};

export default VirtualTokenList;
