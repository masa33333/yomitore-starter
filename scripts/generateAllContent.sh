#!/bin/bash

# 55本のコンテンツ生成バッチスクリプト
# API制限を考慮して小さな単位で実行

echo "🎯 55本のコンテンツ生成開始"

# 各ルートのメール生成（残り140本）
routes=("seoul-beijing" "beijing-paris" "paris-london" "london-newyork")
levels=("L1" "L2" "L3" "L4" "L5")

for route in "${routes[@]}"; do
    echo "📍 $route メール生成開始"
    
    for level in "${levels[@]}"; do
        echo "  🔄 $route $level メール生成中..."
        npm run travel:generate -- --route "$route" --level "$level" --type mail
        
        # API制限回避のため30秒待機
        echo "  ⏳ API制限回避のため30秒待機..."
        sleep 30
    done
    
    echo "✅ $route メール生成完了"
    echo ""
done

echo "🎉 全コンテンツ生成完了!"
echo "📁 生成場所: content/"

# 生成結果のサマリー表示
echo ""
echo "📊 生成結果サマリー:"
find content/letters -name "*.json" | wc -l | xargs echo "手紙:"
find content/mails -name "*.json" | wc -l | xargs echo "メール:"